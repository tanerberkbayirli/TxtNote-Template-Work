import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { THESIS_TEMPLATE_REGISTRY } from '../../../engine/src/registry.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1000 } });
const errors = [], failures = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.THESIS_BASE_URL || 'http://127.0.0.1:5175';
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const selected = async id => assert.deepEqual(await page.locator('[data-layout-selection-box]').evaluateAll(nodes => nodes.map(node => node.dataset.layoutSelectionBox)), [id]);
let imageCount = 0;
try {
  await page.goto(`${base}/tests/thesis.html`);
  for (const entry of THESIS_TEMPLATE_REGISTRY) {
    try {
      const thesis = { templateId: entry.id, templateVersion: entry.templateVersion,
        selection: { universityId: entry.universityId, instituteId: entry.instituteId, degreeType: entry.degreeType, language: entry.language },
        values: { YEAR: '2026', STUDENT_NAME: 'Deneme Öğrenci', ADVISOR_NAME: 'Deneme Danışman' }, sectionContent: {}, enabledSections: [] };
      await page.evaluate(thesis => localStorage.setItem('txtnote-thesis-regression', JSON.stringify({ title: 'Ortak motor etkileşim testi', content: '', researchData: { thesis } })), thesis);
      await page.reload();
      await page.locator('.thesis-paper').first().waitFor();
      await page.locator('[data-layout-type="text"]').first().waitFor();
      await page.getByLabel('Yakınlaştır', { exact: true }).selectOption('100');
      await settle();
      const image = page.locator('[data-layout-type="image"]').first();
      if (await image.count()) {
        await image.scrollIntoViewIfNeeded();
        const id = await image.getAttribute('data-layout-id'), box = await image.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down(); await settle(); await page.mouse.up(); await settle();
        await selected(id); imageCount++;
      }
      const text = page.locator('[data-layout-type="text"]').filter({ hasText: /\S/ }).first();
      const id = await text.getAttribute('data-layout-id');
      await text.click(); await settle(); await selected(id);
      const measure = () => text.evaluate(node => { const rect = node.getBoundingClientRect(), paper = node.closest('.thesis-paper').getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(node); const glyph = range.getBoundingClientRect(); return { x: rect.left - paper.left, y: rect.top - paper.top, width: rect.width, center: glyph.left + glyph.width / 2 - paper.left }; });
      const initial = await measure();
      assert.equal(await page.getByLabel('Hizalama alanı').inputValue(), 'box');
      await page.getByRole('button', { name: 'Ortala', exact: true }).click(); await settle();
      const centered = await measure();
      for (const name of ['Sola hizala', 'Ortala', 'Sağa hizala', 'Ortala']) {
        await page.getByRole('button', { name, exact: true }).click(); await settle();
        const current = await measure();
        for (const key of ['x', 'y', 'width']) assert.ok(Math.abs(current[key] - initial[key]) < .2, `${name}: ${key} drift ${current[key] - initial[key]}`);
        if (name === 'Ortala') assert.ok(Math.abs(current.center - centered.center) < .2, 'center drift');
        await selected(id);
      }
      console.log(`PASS ${entry.id}: selection and repeated alignment`);
    } catch (error) {
      failures.push({ template: entry.id, message: error.message });
      console.log(`FAIL ${entry.id}: ${error.message}`);
    }
  }
  console.log(JSON.stringify({ templates: THESIS_TEMPLATE_REGISTRY.length, images: imageCount, failures, errors }));
  assert.deepEqual(failures, []);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
