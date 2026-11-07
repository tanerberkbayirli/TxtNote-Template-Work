import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../../engine/tools/node_modules/playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const base = process.argv[2] || 'http://localhost:5173';
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const body = page.getByRole('textbox', { name: 'Ana metin metni', exact: true });
const button = name => page.getByRole('button', { name, exact: true });
const size = page.getByLabel('Yazı boyutu (pt)', { exact: true });
async function select(node, collapsed = false) {
  await node.evaluate((el, collapsed) => {
    el.closest('[contenteditable="true"]').focus();
    const range = document.createRange(); range.selectNodeContents(el);
    if (collapsed) range.collapse(true);
    getSelection().removeAllRanges(); getSelection().addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  }, collapsed);
}
async function seed(content) {
  await page.evaluate(content => localStorage.setItem('txtnote-thesis-regression', JSON.stringify({
    title: 'Deneme', content, researchData: { thesis: {
      templateId: 'fixture-university-a-master-tr-v1', templateVersion: '1.0.0',
      values: { YEAR: '2026' }, sectionContent: {}, enabledSections: []
    } }
  })), content);
  await page.reload(); await body.waitFor();
}
const weight = node => node.evaluate(el => Number(getComputedStyle(el).fontWeight));
try {
  await page.goto(`${base}/tests/thesis.html`);
  await seed('<p>İlk sözcük</p><h1>Başlık metni</h1><p><strong><em>Anlamlı metin</em></strong></p>');
  await select(body.locator('p').first());
  await button('Kalın').click();
  assert.equal(Number(await size.inputValue()), 12, 'bold must preserve the inherited 12pt');
  assert.equal(await weight(body.locator('p').first().locator('.fmt-bold')), 700);
  await button('Kalın').click();
  assert.equal(Number(await size.inputValue()), 12, 'unbold must preserve size too');
  assert.equal(await weight(body.locator('p').first().locator('.fmt-not-bold')), 400);
  await select(body.locator('h1'), true);
  await button('Kalın').click();
  await page.keyboard.type('Normal ');
  assert.equal(await weight(body.locator('h1 .fmt-not-bold')), 400, 'heading bold must switch off for new typing');
  assert.equal(Number(await size.inputValue()), 14);
  await select(body.locator('p').last());
  await button('İtalik').click();
  assert.equal(await weight(body.locator('p').last().locator('.fmt-bold')), 700, 'toggling italic preserves semantic bold');
  assert.equal(await body.locator('p').last().locator('.fmt-not-italic').evaluate(el=>getComputedStyle(el).fontStyle), 'normal');
  console.log('PASS independent formatting preserves template size and semantic marks; inherited heading bold can be disabled');

  await seed('İlk başlık<br>İkinci satır<br>Üçüncü satır');
  await body.click(); await body.press('Control+Home');
  await page.getByRole('listbox', {name:'Stil galerisi'}).getByRole('option',{name:'Başlık 1',exact:true}).click();
  assert.equal(await body.locator('h1').innerText(), 'İlk başlık');
  assert.match(await body.innerText(), /İkinci satır[\s\S]*Üçüncü satır/);
  assert.equal(await body.locator('h1').count(), 1);
  console.log('PASS loose br-separated first line converts to one non-empty heading');

  await seed('<p>Sayaç denemesi</p>');
  await body.click();
  await page.waitForTimeout(400);
  const counter = page.locator('[data-thesis-word-count]');
  const before = Number(await counter.getAttribute('data-thesis-word-count'));
  const spot = await body.locator('p').evaluate(el => { const r=el.getBoundingClientRect(); return {x:r.left+60,y:r.bottom+100}; });
  await page.mouse.dblclick(spot.x, spot.y);
  await page.locator('[data-layout-editing="true"]').waitFor();
  await page.keyboard.type('kutuda üç sözcük'); await page.keyboard.press('Escape');
  await page.waitForFunction(expected => Number(document.querySelector('[data-thesis-word-count]').dataset.thesisWordCount) === expected, before + 3);
  await page.reload(); await body.waitFor();
  await page.waitForFunction(expected => Number(document.querySelector('[data-thesis-word-count]').dataset.thesisWordCount) === expected, before + 3);
  console.log('PASS frame words counted once after edit and reload');
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
