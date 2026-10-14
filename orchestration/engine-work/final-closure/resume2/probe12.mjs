import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5210';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=SRC09`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
 const td=document.querySelector('.txn-docx-14318');
 const out=[];
 const walk=(rules)=>{for(const r of rules){if(r.cssRules&&!r.selectorText)walk(r.cssRules);else if(r.selectorText&&r.style&&r.style.whiteSpace&&td.matches(r.selectorText))out.push([r.selectorText.slice(0,200),r.style.whiteSpace,r.style.getPropertyPriority('white-space')]);}};
 for(const sh of document.styleSheets){try{walk(sh.cssRules)}catch(e){}}
 return {out,cs:getComputedStyle(td).whiteSpace,csCollapse:getComputedStyle(td).whiteSpaceCollapse,wrap:getComputedStyle(td).textWrapMode};
});
console.log(JSON.stringify(r,null,1));
await browser.close();
