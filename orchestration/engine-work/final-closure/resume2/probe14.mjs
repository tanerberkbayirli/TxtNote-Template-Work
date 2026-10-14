import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.argv[2]||"SRC09"}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
 const pageOf=y=>sheets.findIndex(([a,b])=>y>=a&&y<b)+1;
 const out=[];
 for(const el of document.querySelectorAll('[data-thesis-fn-stamp],[data-thesis-fn-push]')){const r=el.getBoundingClientRect();out.push([pageOf(r.top+scrollY),el.getAttribute('data-thesis-fn-stamp'),el.getAttribute('data-thesis-fn-reserve'),(el.textContent||'').slice(0,30)]);}
 const arts=[...document.querySelectorAll('.thesis-paper[data-thesis-section]')].map(a=>[a.getAttribute('data-thesis-section'),a.hasAttribute('data-thesis-odd-page-pad'),pageOf(a.getBoundingClientRect().top+scrollY+30),a.querySelectorAll('.thesis-flow-section').length]);
 return {out,arts};
});
console.log(JSON.stringify(r.out));console.log(JSON.stringify(r.arts));
await browser.close();
