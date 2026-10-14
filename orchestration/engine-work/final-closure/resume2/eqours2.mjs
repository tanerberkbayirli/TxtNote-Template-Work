import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.argv[2]||'EQ_PROBE'}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const ps=[...document.querySelectorAll('.thesis-page-flow .rich-text-body > p')].slice(0,6);
 return ps.map(p=>{const cs=getComputedStyle(p);return [(p.textContent||'').slice(0,12),cs.fontSize,cs.lineHeight,cs.marginTop,cs.marginBottom,p.getBoundingClientRect().height, p.dataset.docxStyle]});
});
console.log(JSON.stringify(r));
await browser.close();
