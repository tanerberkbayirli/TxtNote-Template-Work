import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2],needle=process.argv[3];
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(n=>{
 const out=[];
 for(const p of document.querySelectorAll('.thesis-page-flow p')){
   if(!p.textContent.includes(n))continue;
   const cs=getComputedStyle(p);
   out.push({html:p.outerHTML.slice(0,300),style:p.getAttribute('data-thesis-style'),pb:cs.paddingBottom,mb:cs.marginBottom,lh:cs.lineHeight,pt:cs.paddingTop,mt:cs.marginTop,rects:[...p.getClientRects()].map(x=>[x.top,x.bottom]),flowTop:p.closest('.thesis-page-flow').getBoundingClientRect().top,
     ps:p.closest('.thesis-page-flow').parentElement?.dataset.thesisSection});
 }
 return out;
},needle);
console.log(JSON.stringify(r,null,1));
await browser.close();
