// Task 10B: official MCBÜ template on the real thesis editor (Vite fixture), PDF and DOCX.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { settle } from "./task10a1-checks.mjs";
import { fillMcbuThesis, sheetLabels, task10bChecks } from "./task10b-checks.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
// The production PDF writer reads the required system Times New Roman faces.
await page.context().grantPermissions(["local-fonts"], { origin: new URL(process.argv[2] || "http://127.0.0.1:5175").origin });
const errors = [], checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => { if (/content security policy|refused to|uncaught/i.test(e.text())) errors.push(e.text()); });
const out = new URL("../../output/task10b/", import.meta.url);
const file = (name) => new URL(name, out).pathname.replace(/^\/(\w:)/, "$1");
await mkdir(out, { recursive: true });
const pass = (message) => { checks.push(message); console.log(`PASS ${message}`); };
const download = async (prefix) => {
  const files = {};
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    await (await event).saveAs(file(`${prefix}.${extension}`)); files[extension] = file(`${prefix}.${extension}`);
  }
  return files;
};

try {
  await page.goto(`${process.argv[2] || "http://127.0.0.1:5175"}/tests/thesis.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]').waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  const demoLabels = await sheetLabels(page);

  // Doctorate: template chosen from the registry dropdown of an existing (demo) thesis.
  await fillMcbuThesis(page, { degree: "phd" });
  const phd = await task10bChecks(page, pass, () => download("mcbu-phd"));

  // Persistence: only source state is stored; the layout is recomputed identically.
  const stored = await page.evaluate(() => window.thesisTest.getDoc());
  assert.equal(stored.researchData.thesis.templateId, "mcbu-lee-phd-tr-v1");
  assert.doesNotMatch(JSON.stringify(stored), /data-thesis-(?:anchor|number|caption|fn-|toc)|thesis-index|indexRows|"pages"/);
  assert.equal(stored.researchData.thesis.values.STUDENT_NAME, "Çağrı Şükrü ÖZDOĞAN");
  await page.reload(); await page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]').waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100"); await settle(page);
  assert.deepEqual(await page.evaluate(() => window.thesisTest.getDoc()), stored);
  assert.deepEqual(await sheetLabels(page), phd.labels);
  pass("save/reload: identical source state (no pages, anchors, index rows or stamps stored), identical pages and labels");

  // Master's: same document switched to the other degree variant; CV disappears, content stays.
  await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByLabel("Tez şablonu", { exact: true }).selectOption("mcbu-lee-master-tr-v1");
  await page.getByText("YÜKSEK LİSANS TEZİ", { exact: true }).waitFor();
  assert.equal(await page.getByRole("checkbox", { name: "ÖZGEÇMİŞ", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  await settle(page);
  assert.equal(await page.locator('[data-thesis-flow-section="cv"]').count(), 0);
  assert.equal((await page.evaluate(() => window.thesisTest.getDoc())).researchData.thesis.sectionContent.cv, stored.researchData.thesis.sectionContent.cv);
  const master = await task10bChecks(page, pass, () => download("mcbu-master"), { degree: "master" });
  assert.equal(master.labels.length, phd.labels.length - 1);
  pass("Yüksek Lisans variant: degree lines change, ÖZGEÇMİŞ hidden and not offered, stored CV text untouched");

  // Existing templates are unchanged: back to fixture A gives the original page model.
  await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByLabel("Tez şablonu", { exact: true }).selectOption("fixture-university-a-master-tr-v1");
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  await settle(page);
  assert.equal((await sheetLabels(page))[0], demoLabels[0]);
  assert.equal(await page.locator('[data-thesis-special-page="outerCover"]').count(), 1);
  pass("switching back to fixture A renders its own cover and numbering (no migration of the note)");

  assert.deepEqual(errors, []);
  await writeFile(new URL("browser.json", out), JSON.stringify({ status: "passed", checks, errors, phd: { labels: phd.labels, pdf: phd.pdf, docx: phd.docx }, master: { labels: master.labels, pdf: master.pdf } }, null, 2));
} catch (e) {
  await page.screenshot({ path: file("failure.png"), fullPage: true }).catch(() => {});
  await writeFile(new URL("failure.json", out), JSON.stringify({ error: String(e?.stack || e), checks, errors }, null, 2));
  throw e;
} finally { await browser.close(); }
