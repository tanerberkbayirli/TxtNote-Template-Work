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
 const sc=document.querySelector('.thesis-sheet').getBoundingClientRect().width/ (595.32/0.75);
 const tds=[...document.querySelectorAll('td,th')].filter(c=>c.textContent.trim().startsWith(needle));const td=tds[tds.length-1];const t=td.closest('table');const s=getComputedStyle(t);
 return {sc,table:{w_css:getComputedStyle(t).width,layout:s.tableLayout,collapse:s.borderCollapse,cols:[...t.rows[0].cells].map(c=>+(c.getBoundingClientRect().width/sc*0.75).toFixed(1)),colsAttr:[...t.querySelectorAll('col')].map(c=>c.getAttribute('width')||c.style.width), hasColgroup:!!t.querySelector('colgroup')},td:{w:getComputedStyle(td).width,ws:getComputedStyle(td).whiteSpace,rect:+(td.getBoundingClientRect().width/sc*0.75).toFixed(1)},tdAttrs:[...td.attributes].map(a=>a.name+'='+a.value.slice(0,40))}},needle);
console.log(JSON.stringify(r));await browser.close();
