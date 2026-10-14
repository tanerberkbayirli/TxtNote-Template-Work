import { chromium } from '../../tools/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-blink-features=MulticolColumnWrapping'] });
try {
  const page = await browser.newPage();
  await page.goto(process.env.THESIS_BASE_URL || 'http://127.0.0.1:5195');
  const results = await page.evaluate(async () => {
    const { layoutTableContinuations, tableContinuationRows } = await import('/engine/tableContinuation.js');
    const { thesisSourceHtml } = await import('/engine/sourceHtml.js');
    document.head.innerHTML = `<style>
      body{margin:0} .stack{width:300px;transform:scale(1)}
      .flow{column-count:1;column-gap:0;column-height:200px;column-fill:auto;column-wrap:wrap;row-gap:28px}
      table{width:100%;border-collapse:collapse;break-inside:avoid}
      table[data-thesis-tall]{break-inside:auto} tr{break-inside:avoid}
      td{padding:0} p{margin:0;height:24px;line-height:24px}
      caption{height:20px} tr.split{break-inside:auto}
    </style>`;
    const groups = [{ id: 'main', rules: { page: { widthMm: 79.375, heightMm: 52.9166666667,
      margins: { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 } } },
      sections: [{ id: 'main', rules: { tables: { repeatHeader: false } } }] }];
    const render = (rows) => {
      document.body.innerHTML = `<div class="stack"><article class="thesis-paper" data-thesis-section="main" data-thesis-layout="paged"><div class="flow"><div data-thesis-flow-section="main"><div class="thesis-body"><div style="height:80px"></div><table><caption data-thesis-anchor="tbl">Caption</caption><tbody>${rows}</tbody></table></div></div></div></article></div>`;
    };
    const settle = () => { for (let i = 0; i < 5; i++) layoutTableContinuations(document.body, groups, { indexSources: [] }); };
    const state = () => {
      const table = document.querySelector('table');
      return { tall: table.hasAttribute('data-thesis-tall'), firstRowY: table.rows[0].getBoundingClientRect().top,
        metadata: tableContinuationRows(document.body), saved: thesisSourceHtml(table.outerHTML) };
    };
    render(Array.from({ length: 18 }, (_, i) => `<tr><td><p>Row ${i}</p></td></tr>`).join(''));
    const initialRowY = state().firstRowY;
    settle();
    const multipleRows = state();
    for (const row of [...document.querySelector('table').rows].slice(2)) row.remove();
    settle();
    const shortened = state();
    render(Array.from({ length: 6 }, (_, i) => `<tr><td><p>Row ${i}</p></td></tr>`).join(''));
    settle();
    const fitsWholePage = state();
    render(`<tr class="split"><td>${'<p>Long cell</p>'.repeat(18)}</td></tr>`);
    settle();
    return { initialRowY, multipleRows, shortened, fitsWholePage, singleRow: state() };
  });
  for (const key of ['multipleRows', 'singleRow']) {
    assert.equal(results[key].tall, true, key);
    assert.equal(results[key].metadata.tbl.spansPages, true, key);
    assert.ok(results[key].firstRowY < 200, `${key} must start on the partially filled first page`);
    assert.doesNotMatch(results[key].saved, /data-thesis-tall/);
  }
  assert.equal(results.shortened.tall, false, 'shortened table must regain keep-together behavior');
  assert.deepEqual(results.shortened.metadata, {});
  assert.equal(results.fitsWholePage.tall, false, 'a page-fitting table must remain together');
  assert.ok(results.fitsWholePage.firstRowY > 228, 'a page-fitting table must move whole to the next page');
  await writeFile('orchestration/engine-work/mission08/continue-table-proof.json', JSON.stringify({ pass: true, results }, null, 2));
  console.log('PASS: no-repeat tables, single split row, shrinking, export metadata and clean saved HTML');
} finally {
  await browser.close();
}
