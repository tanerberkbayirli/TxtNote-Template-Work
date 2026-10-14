import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.argv[2]}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(([needle,n])=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const out=[];
 for(const tr of document.querySelectorAll('.thesis-page-flow tr')){const t=(tr.textContent||'').replace(/\s+/g,' ');if(!(t.includes('F1 Score')&&t.includes('0.352')))continue;
   const rects=[...tr.getClientRects()].map(r=>{const si=sheets.findIndex(s=>{const sr=s.getBoundingClientRect();return r.top>=sr.top&&r.top<sr.bottom});const sr=sheets[si].getBoundingClientRect();const zoom=sr.width/(210/25.4*96);return [si+1,Math.round((r.top-sr.top)/zoom*0.75*10)/10,Math.round((r.bottom-sr.top)/zoom*0.75*10)/10]});
   const cs=getComputedStyle(tr);const cells=[...tr.cells].map(c=>({paras:c.querySelectorAll('p').length,h:Math.round(c.getBoundingClientRect().height),pb:[...c.querySelectorAll('p')].map(p=>getComputedStyle(p).paddingBottom).join(','),html:c.innerHTML.slice(0,150)}));
   out.push({t:t.slice(0,40),rects,bi:cs.breakInside,ba:cs.breakAfter,bb:cs.breakBefore,cells:cells.slice(0,2)});}
 return out;
},[process.argv[3],+process.argv[4]]);
console.log(JSON.stringify(r.slice(0,4),null,0));
await browser.close();
