import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from '../../../tools/node_modules/playwright/index.mjs';
const base = process.env.THESIS_BASE_URL || 'http://127.0.0.1:5194';
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  await page.goto(base + '/engine/specialPageFit.js');
  await page.setContent(`<style>
    .thesis-paper{width:500px;transform-origin:top left}
    .thesis-body{width:500px;display:flex;flex-direction:column;height:100px;contain:size}
    .thesis-layout-text{height:140px;flex:none}
    .thesis-layout-spacer{height:50px;flex:0 1 50px;min-height:17.5px}
  </style><main id="root"><article class="thesis-paper"><div class="thesis-page-flow"><section data-thesis-flow-section="approval"><div class="thesis-body"><div class="thesis-layout-text" data-thesis-block="0">Seven jurors</div><div class="thesis-layout-spacer" data-thesis-block="1"></div></div></section></div></article></main><style id="measured"></style>`);
  const proof = await page.evaluate(async () => {
    const { measurePositionedSpecialPages, measureElasticSpecialPages, measureSpecialPageFit } = await import('/engine/specialPageFit.js');
    const root = document.querySelector('#root');
    const mm = px => px * 25.4 / 96;
    const model = { sections: [{ id: 'approval', title: 'Onay', type: 'approval', specialPage: true, standalone: true,
      rules: { page: { heightMm: mm(100), margins: { topMm: 0, bottomMm: 0 } } },
      layout: [{ type: 'text', path: '0' }, { type: 'spacer', path: '1', heightMm: mm(50) }] }] };
    const measured = document.querySelector('#measured');
    const measure = () => measurePositionedSpecialPages(root, model);
    const first = measure(); measured.textContent = first.css;
    const repeats = Array.from({ length: 10 }, () => { const result = measure(); measured.textContent = result.css; return result; });
    const uncompressedHeight = document.querySelector('.thesis-body').getBoundingClientRect().height;
    const elasticExport = measureElasticSpecialPages(root);
    document.querySelector('.thesis-paper').style.transform = 'scale(.75)';
    const zoomed = measure(); measured.textContent = zoomed.css;
    const fit = measureSpecialPageFit(root, [{ rules: { page: {} }, sections: model.sections }], () => ({ contentHeightPx: 100, heightPx: 100, topMarginPx: 0 }))[0];
    document.querySelector('.thesis-layout-text').style.height = '60px';
    const shortened = measure(); measured.textContent = shortened.css;
    const restored = getComputedStyle(document.querySelector('.thesis-body')).display;
    document.querySelector('.thesis-layout-text').style.height = '140px';
    const regrown = measure();
    return { first, repeats, uncompressedHeight, elasticExport, zoomed, fit, shortened, restored, regrown };
  });
  assert.match(proof.first.css, /contain:none!important/);
  for (const result of proof.repeats) assert.deepEqual(result, proof.first, 'No oscillation after fallback');
  assert.deepEqual(proof.zoomed, proof.first, 'Zoom-independent minimum');
  assert.equal(proof.uncompressedHeight, 190, 'Authored gap restored');
  assert.deepEqual(proof.elasticExport, { spacers: {}, contentMm: {} }, 'Word receives authored gaps');
  assert.equal(proof.fit.fit.status, 'overflow'); assert.ok(proof.fit.messages.length);
  assert.equal(proof.shortened.css, ''); assert.equal(proof.restored, 'flex');
  assert.deepEqual(proof.regrown, proof.first, 'Growing content re-enters fallback');
  await writeFile('orchestration/engine-work/final-closure/special/fallback-proof.json', JSON.stringify(proof, null, 2));
  console.log('PASS: impossible page fragments with source gaps; 10 stable repeats; 75% zoom; warning; shorten/regrow; Word gap parity');
} finally { await browser.close(); }
