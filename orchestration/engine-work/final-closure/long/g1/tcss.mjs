import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';const needle=process.argv[2];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const ctx=await browser.newContext({viewport:{width:1400,height:1000}});await ctx.grantPermissions(['local-fonts'],{origin:base});
const page=await ctx.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||'SRC09'}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate((needle)=>{
 const tds=[...document.querySelectorAll('td,th')].filter(c=>c.textContent.trim().startsWith(needle));const td=tds[tds.length-1];const t=td.closest('table');
 const id=t.className.match(/txn-[\w-]+/)[0];
 const css=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return []}}).map(r=>r.cssText).filter(x=>x.includes('.'+id+'.'+id+' ')||x.includes('.'+id+' '));
 const matched=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch{return []}}).flatMap(r=>{try{return r.selectorText&&t.matches(r.selectorText)&&(r.style.width||r.style.tableLayout||r.style.minWidth)?[r.selectorText.slice(0,120)+' => w='+r.style.width+' pri='+r.style.getPropertyPriority('width')+' tl='+r.style.tableLayout]:[]}catch{return []}});
 return {matched,wrap:t.parentElement.tagName+'.'+t.parentElement.className.slice(0,40),inline:t.getAttribute('style'),cw:getComputedStyle(t).width,id,tableAttrs:[...t.attributes].map(a=>a.name+'='+a.value.slice(0,40)),css:css.slice(0,5)}},needle);
console.log(JSON.stringify(r,null,1));await browser.close();
