import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../tools/package.json', import.meta.url));
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5175/src/thesis/specialPageFit.js');
  await page.setContent(`<style>
    .thesis-paper{position:relative;width:800px;height:1000px;transform:scale(.75);transform-origin:top left}
    .thesis-layout-group{display:contents}
    [data-thesis-block="0-0"]{position:absolute;left:0;top:100px;width:500px;height:350px;background:#dce8f6}
    [data-thesis-block="1"]{position:absolute;left:0;top:400px;width:500px;height:100px;background:#f9d7bb}
  </style><div id="root"><article class="thesis-paper"><div class="thesis-page-flow"><section data-thesis-flow-section="cover"><div class="thesis-body"><div class="thesis-layout-group" data-thesis-block="0"><div class="thesis-layout-text" data-thesis-block="0-0">Uzun başlık</div></div><div class="thesis-layout-text" data-thesis-block="1">Hazırlayan</div></div></section></div></article></div><style id="measured"></style>`);
  const result = await page.evaluate(async () => {
    const { measurePositionedSpecialPages, measureSpecialPageFit } = await import('/engine/specialPageFit.js');
    const root = document.querySelector('#root');
    const model = { sections: [{ id: 'cover', specialPage: true, standalone: true, layout: [
      { type: 'group', path: '0', blocks: [{ type: 'text', path: '0-0', heightMm: 100 * 25.4 / 96 }] },
      { type: 'text', path: '1', heightMm: 100 * 25.4 / 96 },
    ] }] };
    const groups = [{ rules: { page: {} }, sections: [{ id: 'cover', specialPage: true, title: 'Deneme', type: 'cover' }] }];
    const metrics = () => ({ contentHeightPx: 900, heightPx: 1000, topMarginPx: 0 });
    const before = measureSpecialPageFit(root, groups, metrics)[0];
    const first = measurePositionedSpecialPages(root, model);
    document.querySelector('#measured').textContent = first.css;
    const after = measureSpecialPageFit(root, groups, metrics)[0];
    const second = measurePositionedSpecialPages(root, model);
    document.querySelector('[data-thesis-block="0-0"]').style.height = '100px';
    const restored = measurePositionedSpecialPages(root, model);
    document.querySelector('[data-thesis-block="0-0"]').style.height = '1200px';
    const overflow = measureSpecialPageFit(root, groups, metrics)[0];
    return { before, first, after, second, restored, overflow };
  });
  assert.equal(result.before.fit.status, 'overlap');
  assert.equal(result.after.fit.status, 'ok');
  assert.deepEqual(result.second, result.first, 'Repeated measurement must not accumulate shifts');
  assert.equal(result.restored.positions['cover:1'].shiftMm, 0, 'Deleting title lines restores source anchor');
  assert.equal(result.overflow.fit.status, 'overflow');
  assert.ok(result.overflow.messages.some((message) => /taşıyor/.test(message)));
  writeFileSync('orchestration/engine-work/mission08/resume-positioned-proof.json', JSON.stringify(result, null, 2));
  console.log('PASS: nested/zoomed fixed collision -> shifted fit; stable repeat; restore; visible overflow warning');
} finally { await browser.close(); }
