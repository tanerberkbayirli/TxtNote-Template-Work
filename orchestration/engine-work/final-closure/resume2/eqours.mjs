import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=EQ_PROBE`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const ps=[...document.querySelectorAll('.thesis-page-flow .rich-text-body > p')];
 const sheet=document.querySelector('.thesis-sheet');const sr=sheet.getBoundingClientRect();const scale=sr.width/(210/25.4*96);
 return ps.map(p=>{const r=p.getBoundingClientRect();return [(p.textContent||'').slice(0,12),Math.round((r.top-sr.top)/scale*0.75*10)/10,Math.round(r.height/scale*0.75*10)/10]});
});
console.log(JSON.stringify(r));
await browser.close();
