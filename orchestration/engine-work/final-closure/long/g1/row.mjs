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
 const td=[...document.querySelectorAll('td,th')].find(c=>c.textContent.trim().startsWith(needle));const tr=td.parentElement;
 const k=0.75/ (document.querySelector('.thesis-sheet').getBoundingClientRect().width/ (595.32/0.75)); // scaled px -> pt
 const sc=document.querySelector('.thesis-sheet').getBoundingClientRect().height/841.92;
 const f=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,h_pt:+(r.height/sc).toFixed(2),mt:s.marginTop,mb:s.marginBottom,pt:s.paddingTop,pb:s.paddingBottom,bt:s.borderTopWidth,bb:s.borderBottomWidth,lh:s.lineHeight,fs:s.fontSize,va:s.verticalAlign,h:s.height,disp:s.display}};
 const p=td.querySelector('p');
 return {sc,tr:f(tr),td:f(td),p:p&&f(p),wrapper:[...td.children].map(c=>c.tagName),table:f(tr.closest('table')),trCss:tr.getAttribute('style'), tdAttr:[...td.attributes].map(a=>a.name+'='+a.value.slice(0,30))};
},needle);
console.log(JSON.stringify(r,null,1));await browser.close();
