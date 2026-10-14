import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { settle } from './task10a1-checks.mjs';
import { assertTimesNewRomanEmbedded } from './pdf-font-compliance.mjs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/** Also exercised in the one production WebView2/installer smoke run. */
export async function blankPageChecks(page, pass, exportFiles) {
  const put = async (id, html) => {
    await page.locator(`[data-thesis-flow-section="${id}"] .rich-text-body[contenteditable="true"]`).evaluate((root, html) => {
      root.innerHTML = html;
      root.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    }, html);
    await settle(page);
  };
  const results = [];
  await put('main', '<p><br></p>');
  for (const [kind, content, count] of [
    ['short', '<p>Kısa giriş metni.</p>', 1],
    ['long', Array.from({ length: 6 }, (_, i) => `<p>Giriş paragrafı ${i}. ${'Araştırmanın amacı ve kapsamı açıklanmaktadır. '.repeat(12)}</p>`).join(''), 2],
  ]) {
    await put('introduction', content);
    const labels = id => page.locator(`.thesis-paper[data-thesis-section="${id}"]`).evaluate(el => [...el.parentElement.querySelectorAll('.thesis-sheet')].map(s => s.dataset.thesisPageLabel || ''));
    assert.deepEqual(await labels('introduction'), count === 1 ? ['1'] : ['1', '2']);
    assert.deepEqual(await labels('main'), []);
    assert.deepEqual(await labels('bibliography'), [String(count + 1)]);
    assert.deepEqual(await labels('appendices'), [String(count + 2)]);
    const toc = await page.locator('[data-thesis-generated="toc"] li').allInnerTexts();
    assert.ok(toc.some(t => t.includes('KAYNAKÇA') && t.trim().endsWith(String(count + 1))));
    const files = await exportFiles(kind);
    const bytes = new Uint8Array(await readFile(files.pdf));
    const fonts = assertTimesNewRomanEmbedded(bytes);
    const task = getDocument({ data: bytes.slice(), useSystemFonts: false, disableFontFace: true });
    try {
      const pdf = await task.promise;
      assert.equal(pdf.numPages, await page.locator('.thesis-sheet').count());
      for (let p = 1; p <= pdf.numPages; p++) {
        const text = (await (await pdf.getPage(p)).getTextContent()).items.map(i => i.str).join(' ');
        assert.ok(text.replace(/\b\d+\b/g, '').trim(), `chrome-only physical page ${p}`);
      }
      results.push({ kind, physicalPages: pdf.numPages, bibliography: count + 1, appendices: count + 2, fonts, files });
    } finally { await task.destroy(); }
    pass(`packaged empty-group regression ${kind}: no blank page, correct TOC/Arabic labels, real embedded TNR`);
  }
  return results;
}
