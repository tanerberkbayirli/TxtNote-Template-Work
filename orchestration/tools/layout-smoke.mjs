import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const baseUrl = process.argv[2] || 'http://127.0.0.1:5200';
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-blink-features=MulticolColumnWrapping'],
});
const result = { baseUrl, errors: [] };
try {
  const page = await browser.newPage();
  page.on('pageerror', error => result.errors.push(error.message));
  const response = await page.goto(baseUrl + '/tests/thesis.html', { waitUntil: 'domcontentloaded' });
  result.status = response.status();
  await page.locator('.thesis-sheet').first().waitFor({ timeout: 60000 });
  result.engine = await page.evaluate(async () => {
    const engine = await import('/engine/engine.js');
    const registry = await import('/engine/registry.js');
    return { compile: typeof engine.compileThesisDocument, templates: registry.THESIS_TEMPLATE_REGISTRY.length };
  });
  result.sheets = await page.locator('.thesis-sheet').count();
  result.pass = result.status === 200 && result.engine.compile === 'function' && result.engine.templates > 0 && result.sheets > 0 && result.errors.length === 0;
} catch (error) { result.error = error.message; result.pass = false; }
finally { await browser.close(); }
await writeFile(new URL('../reports/layout-reorganization-browser.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (!result.pass) process.exitCode = 1;
