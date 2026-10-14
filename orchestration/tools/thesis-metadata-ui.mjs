import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { THESIS_TEMPLATE_REGISTRY, resolveThesisTemplate } from "../../engine/src/registry.js";
import { compileThesisDocument } from "../../engine/src/engine.js";
import { thesisMetadataPanel } from "../../engine/src/metadataPanel.js";
const { chromium } = createRequire(import.meta.url)("./node_modules/playwright");
const base = "http://127.0.0.1:5176";
const out = process.env.THESIS_UI_OUT || "orchestration/validation/metadata-panel";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const results = [];
try {
  for (const descriptor of THESIS_TEMPLATE_REGISTRY.filter(item => !process.env.THESIS_TEMPLATE_FILTER || item.id.includes(process.env.THESIS_TEMPLATE_FILTER))) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.grantPermissions(["local-fonts"], { origin: base });
    const page = await context.newPage();
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/tests/iyte.html`);
    await page.getByLabel("Üniversite", { exact: true }).selectOption(descriptor.universityId);
    await page.getByLabel("Enstitü", { exact: true }).selectOption(descriptor.instituteId);
    await page.getByLabel("Tez türü", { exact: true }).selectOption(descriptor.degreeType);
    await page.getByLabel("Dil", { exact: true }).selectOption(descriptor.language);
    await page.getByRole("button", { name: "Tez oluştur", exact: true }).click();
    await page.locator(`[data-thesis-template-id="${descriptor.id}"]`).waitFor();
    await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
    const { template } = await resolveThesisTemplate(descriptor);
    const checkFields = async () => {
      const doc = await page.evaluate(() => window.iyteTest.getDoc());
      const model = compileThesisDocument(template, doc.researchData.thesis, doc.title, doc.content);
      const panel = thesisMetadataPanel(template, model.sections);
      assert.equal(await page.locator('[aria-label="Tez bilgileri"] h4').filter({ hasText: /^KAYNAKÇA$/ }).count(), model.sections.some(section => section.type === "bibliography") ? 1 : 0);
      const expected = panel.fields.map(([key]) => key);
      if (panel.hasPrimaryTitle) expected.push("THESIS_TITLE");
      await page.waitForFunction(expected => {
        const actual = [...document.querySelectorAll('[aria-label="Tez bilgileri"] [data-thesis-metadata-field]')].map(node => node.dataset.thesisMetadataField).sort();
        return JSON.stringify(actual) === JSON.stringify(expected.sort());
      }, expected);
      const actual = await page.locator('[aria-label="Tez bilgileri"] [data-thesis-metadata-field]').evaluateAll(nodes => nodes.map(node => node.dataset.thesisMetadataField));
      assert.deepEqual(actual.sort(), expected.sort(), descriptor.id);
      const emptyGroups = await page.locator('[aria-label="Tez bilgileri"] section').evaluateAll(nodes => nodes.filter(node => node.querySelector('h4') && !node.querySelector('input,select,button')).map(node => node.innerText));
      assert.deepEqual(emptyGroups, [], descriptor.id);
      return expected;
    };
    const initial = await checkFields();
    const options = page.locator('[aria-label="Tez bilgileri"] input[type="checkbox"]');
    const count = await options.count();
    for (let i = 0; i < count; i++) await options.nth(i).check();
    const enabled = await checkFields();
    if (initial.includes("THESIS_TITLE")) await page.getByLabel("Tez başlığı", { exact: true }).fill("PANEL VERIFICATION TITLE");
    await page.reload();
    await page.locator(`[data-thesis-template-id="${descriptor.id}"]`).waitFor();
    await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
    await checkFields();
    if (initial.includes("THESIS_TITLE")) assert.equal(await page.getByLabel("Tez başlığı", { exact: true }).inputValue(), "PANEL VERIFICATION TITLE");
    assert.deepEqual(errors, [], descriptor.id);
    if (["iyte-eee-undergraduate-en-v1", "iyte-lee-master-en-v1", THESIS_TEMPLATE_REGISTRY[0].id].includes(descriptor.id)) await page.screenshot({ path: `${out}/${descriptor.id}.png` });
    results.push({ id: descriptor.id, status: "PASS", initialFields: initial, optionalSectionsEnabledFields: enabled });
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`${out}/report.json`, JSON.stringify({ status: "PASS", results }, null, 2) + "\n");
console.log(`PASS: ${results.length} templates, metadata fields, optional sections, empty groups and reload`);
