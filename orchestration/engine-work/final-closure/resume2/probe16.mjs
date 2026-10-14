import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.argv[2]}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(([needle,n])=>{
 const sheet=[...document.querySelectorAll('.thesis-sheet')][n-1];const sr=sheet.getBoundingClientRect();const zoom=sr.width/(210/25.4*96);
 const f=v=>Math.round(v/zoom*0.75*10)/10;
 const out=[];
 for(const p of document.querySelectorAll('.thesis-page-flow p, .thesis-page-flow td, .thesis-page-flow li')){const t=(p.textContent||'');if(!t.includes(needle))continue;const rr=p.getBoundingClientRect();if(rr.top<sr.top-5||rr.top>sr.bottom+5)continue;
   const chain=[];let e=p;while(e&&!e.classList?.contains('thesis-page-flow')){chain.push(e.tagName+(e.dataset?.docxStyle?'['+e.dataset.docxStyle+']':''));e=e.parentElement;}
   const cs=getComputedStyle(p);out.push({tag:p.tagName,top:f(rr.top-sr.top),bottom:f(rr.bottom-sr.top),chain:chain.join('<'),pb:cs.paddingBottom,lh:cs.lineHeight,html:p.outerHTML.slice(0,200)});}
 return out.slice(0,6);
},[process.argv[3],+process.argv[4]]);
console.log(JSON.stringify(r,null,1));
await browser.close();
