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
 for(const el of document.querySelectorAll('.thesis-page-flow img,.thesis-page-flow svg,.thesis-page-flow figure,.thesis-page-flow [data-docx-drawing],.thesis-page-flow [data-drawing],.thesis-page-flow p')){
   const r=el.getBoundingClientRect();if(r.bottom<sr.top||r.top>sr.bottom||r.right<sr.left||r.left>sr.right)continue;
   if(el.tagName==='P'&&r.height<60)continue;
   out.push({tag:el.tagName,cls:el.className&&String(el.className).slice(0,40),top:f(r.top-sr.top),h:f(r.height),w:f(r.width),left:f(r.left-sr.left),id:el.dataset?.txtNodeId,mt:getComputedStyle(el).marginTop,pb:getComputedStyle(el).paddingBottom});
 }
 return out;
},pageNo);
console.log(JSON.stringify(r,null,0).replace(/\},/g,'},\n'));
await browser.close();
