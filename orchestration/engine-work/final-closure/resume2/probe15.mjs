import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=SRC09`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const sh=sheets[116];const sr=sh.getBoundingClientRect();const zoom=sr.width/(210/25.4*96);
 const f=v=>Math.round(v/zoom*0.75*10)/10;
 const out=[];
 for(const p of document.querySelectorAll('.thesis-page-flow p')){const t=p.textContent||'';if(!/^\d\) /.test(t))continue;const rr=p.getBoundingClientRect();if(rr.top<sr.top-5||rr.top>sr.bottom+5)continue;const cs=getComputedStyle(p);out.push([t.slice(0,20),f(rr.top-sr.top),f(rr.bottom-sr.top),cs.paddingBottom,cs.marginBottom,cs.lineHeight,p.className.slice(0,20),p.getAttribute('data-thesis-fn-stamp')]);}
 const fl=document.querySelector('.thesis-paper[data-thesis-section="docx-section-28"] .thesis-page-flow');
 return {out,zoom,sheetH:f(sr.height)};
});
console.log(JSON.stringify(r,null,0));
await browser.close();
