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
 const sheet=[...document.querySelectorAll('.thesis-sheet')][n-1];const sr=sheet.getBoundingClientRect();
 const scale=sr.width/ (210/25.4*96);
 const out=[];
 const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let t;
 const rg=document.createRange();
 while(t=w.nextNode()){if(!t.parentElement.closest('.thesis-page-flow'))continue;const txt=t.nodeValue;if(!txt.trim())continue;
   rg.selectNodeContents(t);for(const r of rg.getClientRects()){if(r.top<sr.top-1||r.bottom>sr.bottom+1)continue;if(r.right<sr.left||r.left>sr.right)continue;out.push([ (r.top-sr.top)/scale*0.75,(r.bottom-sr.top)/scale*0.75, txt.trim(), t.parentElement.closest('p,h1,h2,h3,h4,li')?.tagName]);}}
 return {scale,sheetH:sr.height/scale*0.75,out};
},pageNo);
console.log('scale',r.scale,'sheetH pt',r.sheetH);
const lines=new Map();for(const [a,b,t,tag] of r.out){const k=Math.round(a);if(!lines.has(k))lines.set(k,[]);lines.get(k).push(t)}
for(const k of [...lines.keys()].sort((a,b)=>a-b))console.log(k,lines.get(k).join(" ").slice(0,160));
await browser.close();
