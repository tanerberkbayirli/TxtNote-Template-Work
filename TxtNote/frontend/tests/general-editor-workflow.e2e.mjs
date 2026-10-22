import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { SYSTEM_PDF_FONT_FAMILIES } from '../src/lib/systemPdfFonts.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 920 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const output = new URL('../../../.test-tmp/validation/general-editor-20261018/', import.meta.url);
await mkdir(output, { recursive: true });
try {
  // Headless local-font enumeration is incomplete. Supply the real installed
  // Windows font bytes through a test-only bridge, as desktop IPC does.
  const faces = Object.values(SYSTEM_PDF_FONT_FAMILIES).flatMap(Object.values);
  await page.exposeFunction('readWorkflowFont', async postscript => {
    const face = faces.find(item => item.postscript === postscript);
    assert.ok(face, 'Only known font faces can be read');
    return (await readFile(`${process.env.SystemRoot || 'C:/Windows'}/Fonts/${face.file}`)).toString('base64');
  });
  await page.addInitScript(() => {
    window.queryLocalFonts = async ({ postscriptNames }) => postscriptNames.map(postscriptName => ({
      postscriptName, blob: async () => new Blob([Uint8Array.from(atob(await window.readWorkflowFont(postscriptName)), char => char.charCodeAt(0))]),
    }));
  });
  await page.goto(`${process.env.THESIS_BASE_URL || 'http://127.0.0.1:5187'}/tests/thesis.html`);
  await page.locator('.thesis-paper').first().waitFor();
  const drawer = page.getByRole('complementary', { name: 'Yan paneller', exact: true });
  const opener = page.getByRole('button', { name: 'Paneller', exact: true });
  const panels = ['Yazım planı', 'Kaynaklar', 'Rehber', 'Sayfa ayarları', 'Öğe', 'Tez bilgileri'];
  for (const width of [1380, 500, 360]) {
    await page.setViewportSize({ width, height: 920 });
    await opener.click();
    await page.getByRole('button', { name: 'Paneli kapat', exact: true }).waitFor();
    await drawer.evaluate(node => node.getAnimations().forEach(animation => animation.finish()));
    for (const name of panels) {
      await drawer.getByRole('navigation', { name: 'Panel seç' }).getByRole('button', { name, exact: true }).click();
      assert.equal(await drawer.locator('nav button.is-active').innerText(), name);
      const metrics = await drawer.evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, right: node.getBoundingClientRect().right }));
      assert.ok(metrics.scroll <= metrics.width + 2, `${width}: ${name} overflows`);
      assert.ok(metrics.right <= width + 1);
    }
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
    assert.equal(await opener.evaluate(node => node === document.activeElement), true);
  }
  checks.push('Six panels at 1380/500/360px; Escape closes and restores focus');
  await page.setViewportSize({ width: 1380, height: 920 });
  await opener.click();
  await page.getByRole('tab', { name: 'Dosya', exact: true }).click();
  assert.equal(await page.getByRole('tab', { name: 'Dosya', exact: true }).evaluate(node => node === document.activeElement), true);
  await page.getByRole('tab', { name: 'Giriş', exact: true }).click();
  const body = page.locator('[data-thesis-flow-section="main"] [role="textbox"]').first();
  await body.fill('Ortak düzen kontrolü');
  await body.press('End');
  const bullet = page.getByRole('button', { name: 'Madde işaretli liste', exact: true });
  const numbered = page.getByRole('button', { name: 'Numaralı liste', exact: true });
  await bullet.click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Madde işaretli liste"]').getAttribute('aria-pressed') === 'true');
  assert.equal(await numbered.getAttribute('aria-pressed'), 'false');
  await numbered.click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Numaralı liste"]').getAttribute('aria-pressed') === 'true');
  assert.equal(await bullet.getAttribute('aria-pressed'), 'false');
  await page.getByRole('button', { name: 'Kalın', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Kalın', exact: true }).getAttribute('aria-pressed'), 'true');
  checks.push('Bullet/numbered list and bold states follow the current text');
  await page.getByRole('tab', { name: 'Dosya', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-thesis-pagination-ready="true"]'), { timeout: 60000 });
  const downloads = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  for (const [label, extension] of [['PDF', 'pdf'], ['Word', 'docx']]) {
    console.log(`Checking ${label} download`);
    const button = page.getByRole('button', { name: label, exact: true });
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });
    await button.evaluate(node => { node.click(); node.click(); });
    console.log(`${label}: started`);
    await page.waitForFunction(() => document.querySelector('[aria-label="PDF"]').disabled && document.querySelector('[aria-label="Word"]').disabled);
    assert.notEqual(await page.locator('.thesis-export-ready').getAttribute('data-ready'), 'true');
    const download = await downloadPromise;
    console.log(`${label}: download received`);
    assert.ok(download.suggestedFilename().endsWith(`.${extension}`));
    assert.equal(await download.failure(), null);
    await download.saveAs(new URL(`workflow.${extension}`, output).pathname.replace(/^\/(\w:)/, '$1'));
    await page.waitForFunction(() => document.querySelector('.thesis-ribbon-message')?.textContent.includes('indirme tarayıcıya gönderildi'));
    assert.equal(await button.isEnabled(), true);
  }
  assert.equal(downloads.length, 2, 'Repeated clicks must produce one download per format');
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    window.restoreDownload = () => { URL.createObjectURL = original; };
    URL.createObjectURL = blob => {
      if (blob.type.includes('wordprocessingml')) throw new Error('Kontrollü indirme hatası');
      return original.call(URL, blob);
    };
  });
  await page.getByRole('button', { name: 'Word', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.thesis-ribbon-message')?.textContent.includes('Word dışa aktarılamadı. Kontrollü indirme hatası'));
  assert.equal(await page.getByRole('button', { name: 'Word', exact: true }).isEnabled(), true);
  await page.evaluate(() => window.restoreDownload());
  checks.push('Real PDF/DOCX downloads; busy feedback, duplicate prevention and error recovery');
  await page.screenshot({ path: new URL('desktop.png', output).pathname.replace(/^\/(\w:)/, '$1') });
  assert.deepEqual(errors, []);
  console.log(checks.join('\n'));
} catch (error) {
  errors.push(error.message);
  console.error('Editor message:', await page.locator('.thesis-ribbon-message').allTextContents());
  await page.screenshot({ path: new URL('failure.png', output).pathname.replace(/^\/(\w:)/, '$1') });
  throw error;
} finally {
  await writeFile(new URL('result.json', output), JSON.stringify({ status: errors.length ? 'FAIL' : 'PASS', checks, errors, fontAccess: 'Test-only bridge supplies actual Windows font bytes to headless browser; app font checks unchanged.' }, null, 2));
  await browser.close();
}
