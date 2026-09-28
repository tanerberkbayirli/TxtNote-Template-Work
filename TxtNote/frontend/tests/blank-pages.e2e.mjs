import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mcbuThesis } from './task10b-document.mjs';
import { settle } from './task10a1-checks.mjs';
import { assertTimesNewRomanEmbedded } from './pdf-font-compliance.mjs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.context().grantPermissions(['local-fonts'], { origin: 'http://127.0.0.1:5175' });
const out = new URL('../../output/blank-pages/', import.meta.url);
const file = name => new URL(name, out).pathname.replace(/^\/(\w:)/, '$1');
const baseline = process.argv.includes('--before');
const results = [];
await mkdir(out, { recursive: true });
try {
  await page.goto('http://127.0.0.1:5175/tests/thesis.html');
  for (const [name, intro, main] of [
    ['short', '<p>Kısa giriş metni.</p>', '<p><br></p>'],
    ['long', Array.from({ length: 6 }, (_, i) => `<p>Giriş paragrafı ${i}. ${'Araştırmanın amacı ve kapsamı açıklanmaktadır. '.repeat(12)}</p>`).join(''), ''],
    ['intentional', '<p>Kısa giriş metni.</p>', '<div class="academic-page-break" contenteditable="false"></div><p><br></p>'],
    ['heading', '<p>Kısa giriş metni.</p>', '<h1>Birinci bölüm</h1><p>Bölüm içeriği.</p><h1>İkinci bölüm</h1><p>İkinci bölüm içeriği.</p>'],
  ]) {
    if (baseline && !['short', 'long'].includes(name)) continue;
    const doc = mcbuThesis('');
    doc.title = 'Boş sayfa regresyonu'; doc.content = main;
    Object.assign(doc.researchData.thesis.sectionContent, { introduction: intro, bibliography: '<p>Örnek kaynak.</p>', appendices: '<p>Ek belgesi.</p>' });
    await page.evaluate(doc => localStorage.setItem('txtnote-thesis-regression', JSON.stringify(doc)), doc);
    await page.reload();
    await page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]').waitFor();
    await page.getByLabel('Yakınlaştır', { exact: true }).selectOption('100');
    await settle(page);
    const state = await page.evaluate(() => ({
      groups: [...document.querySelectorAll('.thesis-paper')].map(el => ({ id: el.dataset.thesisSection, count: Number(el.dataset.thesisPageCount), text: el.querySelector('.thesis-page-flow').innerText, labels: [...el.parentElement.querySelectorAll('.thesis-sheet')].map(s => s.dataset.thesisPageLabel || '') })),
      toc: [...document.querySelectorAll('[data-thesis-generated="toc"] li')].map(el => el.innerText),
      total: Number(document.querySelector('[data-thesis-total-pages]').dataset.thesisTotalPages),
    }));
    const exported = {};
    for (const [button, ext] of [['PDF', 'pdf'], ['Word', 'docx']]) {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: button, exact: true }).click();
      const path = file(`${baseline ? 'before' : 'after'}-${name}.${ext}`);
      await (await pending).saveAs(path); exported[ext] = path;
    }
    const bytes = new Uint8Array(await readFile(exported.pdf));
    const fonts = assertTimesNewRomanEmbedded(bytes);
    const task = getDocument({ data: bytes.slice(), useSystemFonts: false, disableFontFace: true });
    const pdf = await task.promise;
    const texts = [];
    for (let i = 1; i <= pdf.numPages; i++) texts.push((await (await pdf.getPage(i)).getTextContent()).items.map(item => item.str).join(' '));
    const result = { name, ...state, physicalCount: pdf.numPages, texts, fonts, files: exported };
    await writeFile(new URL(`${baseline ? 'before' : 'after'}-${name}.json`, out), JSON.stringify(result, null, 2));
    results.push(result);
    await task.destroy();
    if (!baseline) {
      const group = id => state.groups.find(g => g.id === id);
      assert.equal(state.total, texts.length);
      assert.deepEqual(group('introduction').labels, name === 'long' ? ['1', '2'] : ['1']);
      if (name === 'short' || name === 'long') {
        assert.equal(group('main').count, 0);
        const next = name === 'long' ? '3' : '2';
        assert.deepEqual(group('bibliography').labels, [next]);
        assert.deepEqual(group('appendices').labels, [String(Number(next) + 1)]);
        assert.ok(texts.every(t => t.replace(/\b\d+\b/g, '').trim()), 'no chrome-only PDF page');
        assert.ok(state.toc.some(t => t.includes('KAYNAKÇA') && t.trim().endsWith(next)), 'TOC bibliography page');
      } else assert.ok(group('main').count >= (name === 'heading' ? 2 : 1));
      if (name === 'short') {
        const editor = page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]');
        await editor.fill('Yeni bölüm içeriği'); await settle(page);
        assert.equal(await page.locator('.thesis-paper[data-thesis-section="main"]').getAttribute('data-thesis-page-count'), '1');
        await editor.fill(''); await settle(page);
        assert.equal(await page.locator('.thesis-paper[data-thesis-section="main"]').getAttribute('data-thesis-page-count'), '0');
      }
    }
    console.log(JSON.stringify({ name, count: result.physicalCount, groups: state.groups.map(({ id, count, labels }) => ({ id, count, labels })) }));
  }
  await writeFile(new URL(baseline ? 'before.json' : 'after.json', out), JSON.stringify(results, null, 2));
} finally { await browser.close(); }
