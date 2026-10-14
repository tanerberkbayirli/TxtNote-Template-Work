import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=SRC10`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')];
 const loc=r=>{const si=sheets.findIndex(s=>{const sr=s.getBoundingClientRect();return r.top>=sr.top-1&&r.top<sr.bottom});const sr=sheets[si].getBoundingClientRect();const zoom=sr.width/(210/25.4*96);return [si+1,Math.round((r.top-sr.top)/zoom*0.75*10)/10,Math.round((r.bottom-sr.top)/zoom*0.75*10)/10]};
 const out=[];
 for(const tr of document.querySelectorAll('.thesis-page-flow tr')){const t=(tr.textContent||'');if(!t.includes('Recall')&&!t.includes('F1 Score'))continue;const rr=[...tr.getClientRects()];const l=loc(rr[0]);if(l[0]!==83&&l[0]!==84)continue;
  out.push({t:t.slice(0,30),loc:l,frags:rr.length,cells:[...tr.cells].map(c=>({np:c.querySelectorAll('p').length,pb:[...c.querySelectorAll('p')].map(p=>getComputedStyle(p).paddingBottom+'/'+getComputedStyle(p).marginBottom).join(' ')}))});}
 return out;
});
console.log(JSON.stringify(r,null,0).replace(/\},\{"t"/g,'},\n{"t"'));
await browser.close();
