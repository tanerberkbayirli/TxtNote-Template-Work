import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';const sel=process.argv[2];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});await ctx.grantPermissions(['local-fonts'],{origin:base});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||'SRC09'}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate((sel)=>{const e=document.querySelector(sel);const s=getComputedStyle(e);const lines=[];const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode()){const r=document.createRange();r.selectNodeContents(t);for(const q of r.getClientRects())lines.push([t.textContent.slice(0,20),+q.left.toFixed(1),+q.width.toFixed(1),+q.top.toFixed(1)])}
 return {ff:s.fontFamily,fw:s.fontWeight,fs:s.fontSize,ls:s.letterSpacing,lines,ffs:[...e.querySelectorAll('*')].map(c=>getComputedStyle(c).fontFamily).filter((v,i,a)=>a.indexOf(v)===i)}},sel);
console.log(JSON.stringify(r,null,1));await browser.close();
