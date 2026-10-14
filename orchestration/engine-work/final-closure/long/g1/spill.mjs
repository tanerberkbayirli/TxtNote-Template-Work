import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});await ctx.grantPermissions(['local-fonts'],{origin:base});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||'SRC09'}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.height]});
 const k=841.92/sheets[0][1];const pageOf=y=>sheets.findIndex(([t,h])=>y>=t&&y<t+h+20)+1;
 const out=[];
 for(const rule of [...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return []}})){
  if(rule.style&&rule.style.paddingBottom&&rule.style.breakInside==='avoid'&&/txn-/.test(rule.selectorText||'')){
   const el=document.querySelector(rule.selectorText.replace(/^\.thesis-paper \.thesis-body /,'.thesis-body '));
   const r=el&&el.getBoundingClientRect();const pg=r?pageOf(r.top+scrollY):null;
   out.push({sel:rule.selectorText.slice(-30),pb:rule.style.paddingBottom,mb:rule.style.marginBottom,page:pg,top:r?+((r.top+scrollY-sheets[pg-1][0])*k).toFixed(1):null,text:el&&el.textContent.slice(0,15)})}}
 return out;});
for(const x of r)console.log(JSON.stringify(x));await browser.close();
