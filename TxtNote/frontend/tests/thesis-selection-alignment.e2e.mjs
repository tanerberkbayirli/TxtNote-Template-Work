import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mcbuThesis } from './task10b-document.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const selected = id => page.locator('[data-layout-selection-box]').evaluateAll(nodes => nodes.map(node => node.dataset.layoutSelectionBox)).then(ids => assert.deepEqual(ids, [id]));
try {
  await page.goto(`${process.env.THESIS_BASE_URL || 'http://127.0.0.1:5175'}/tests/thesis.html`);
  const doc = mcbuThesis('');
  await page.evaluate(value => localStorage.setItem('txtnote-thesis-regression', JSON.stringify(value)), doc);
  await page.reload();
  await page.locator('[data-layout-id]').first().waitFor();
  await page.getByLabel('Yakınlaştır', { exact: true }).selectOption('100');
  await settle();
  // First selection opens the inspector, changing the paper's position before mouseup.
  const image = page.locator('[data-layout-type="image"]').first();
  const imageId = await image.getAttribute('data-layout-id');
  await image.scrollIntoViewIfNeeded();
  const box = await image.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await settle();
  await page.mouse.up();
  await settle();
  await selected(imageId);
  console.log('PASS first image selection survives inspector opening between pointerdown and pointerup');

  // Empty text-frame space must not hide the image underneath it.
  await page.evaluate(id => {
    const image = document.querySelector(`[data-layout-id="${id}"]`);
    const text = document.querySelector('[data-layout-type="text"]');
    const rect = image.getBoundingClientRect(), paper = image.offsetParent.getBoundingClientRect();
    Object.assign(text.style, { position: 'absolute', left: `${rect.left - paper.left}px`, top: `${rect.top - paper.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, zIndex: '100', textAlign: 'left', padding: '0', margin: '0', transform: 'none' });
    text.textContent = 'X';
  }, imageId);
  const covered = await image.boundingBox();
  await page.mouse.click(covered.x + covered.width * .8, covered.y + covered.height * .8);
  await settle();
  await selected(imageId);
  console.log('PASS image under transparent text-frame space remains selectable');
  await page.reload();
  await page.locator('[data-layout-id]').first().waitFor();
  await page.getByLabel('Yakınlaştır', { exact: true }).selectOption('100');
  const text = page.locator('[data-layout-id="inner-cover:block:0.1"]');
  await text.click();
  await settle();
  const measure = () => text.evaluate(node => {
    const box = node.getBoundingClientRect(), paper = node.closest('.thesis-paper').getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(node);
    const glyphs = range.getBoundingClientRect();
    return { x: box.left - paper.left, y: box.top - paper.top, width: box.width, center: glyphs.left + glyphs.width / 2 - paper.left, pageCenter: paper.width / 2 };
  });
  const initial = await measure();
  assert.equal(await page.getByLabel('Hizalama alanı').inputValue(), 'box');
  for (const label of ['Sola hizala', 'Ortala', 'Sağa hizala', 'Ortala', 'Sola hizala', 'Ortala']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await settle();
    const current = await measure();
    for (const key of ['x', 'y', 'width']) assert.ok(Math.abs(current[key] - initial[key]) < .1, `${label} changed ${key}`);
    if (label === 'Ortala') assert.ok(Math.abs(current.center - initial.center) < .1, 'center drifted');
  }
  console.log('PASS left/right/center cycles preserve template text box and original center');
  await page.getByLabel('Hizalama alanı').selectOption('page');
  for (const label of ['Sola hizala', 'Ortala', 'Sağa hizala', 'Ortala']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await settle();
    const current = await measure();
    assert.ok(Math.abs(current.y - initial.y) < .1, 'vertical drift');
    if (label === 'Ortala') assert.ok(Math.abs(current.center - current.pageCenter) < .1, 'not centered on page');
  }
  console.log('PASS explicit page alignment centers glyphs precisely without vertical drift');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
