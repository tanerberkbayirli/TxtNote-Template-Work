import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2],needle=process.argv[3];
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(n=>{
 const td=[...document.querySelectorAll('.thesis-page-flow td,.thesis-page-flow th')].find(c=>c.textContent.trim().startsWith(n));
 const cs=getComputedStyle(td);const t=td.closest('table');const tcs=getComputedStyle(t);
 return {cell:{w:td.getBoundingClientRect().width,css:cs.width,ws:cs.whiteSpace,pad:cs.padding,font:cs.font,html:td.outerHTML.slice(0,300)},table:{w:t.getBoundingClientRect().width,layout:tcs.tableLayout,cw:tcs.width},cols:[...t.rows[0].cells].map(c=>c.getBoundingClientRect().width)};
},process.argv[3]);
console.log(JSON.stringify(r,null,1));
await browser.close();
