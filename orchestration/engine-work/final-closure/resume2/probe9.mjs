import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2],pageNo=+process.argv[3];
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(n=>{
 const sheet=[...document.querySelectorAll('.thesis-sheet')][n-1];const sr=sheet.getBoundingClientRect();const scale=sr.width/(210/25.4*96);
 const f=v=>Math.round(v/scale*0.75*10)/10;
 const out=[];
 for(const el of document.querySelectorAll('.thesis-page-flow > .thesis-flow-section .rich-text-body > *')){
   const r=el.getBoundingClientRect();if(r.bottom<sr.top||r.top>sr.bottom)continue;
   const cs=getComputedStyle(el);
   out.push([el.tagName,f(r.top-sr.top),f(r.height),cs.marginTop,cs.marginBottom,cs.lineHeight,cs.display,(el.textContent||'').slice(0,30),el.dataset.txtNodeId]);
 }
 return out;
},pageNo);
for(const row of r)console.log(row.join(" | "));
await browser.close();
