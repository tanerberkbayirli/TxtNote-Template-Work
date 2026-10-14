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
   if(!p.textContent.startsWith(n))continue;
   const cs=getComputedStyle(p);const par=p.parentElement;
   out.push({parent:par.tagName+'.'+par.className,gp:par.parentElement.tagName,fit:p.querySelectorAll('[data-thesis-word-fit]').length,align:cs.textAlign,w:cs.width,ti:cs.textIndent,ml:cs.marginLeft,pl:cs.paddingLeft,font:cs.fontFamily,fs:cs.fontSize,ls:cs.letterSpacing,ws:cs.wordSpacing,hasTab:/[\t\r\n]/.test(p.textContent),hasSel:!!p.querySelector('br,img,svg,math,.math-formula,[data-thesis-tab],[data-thesis-mirror-narrow],[contenteditable="false"]'),html:p.outerHTML.slice(0,600),liW:par.getBoundingClientRect().width});
 }
 return out;
},needle);
console.log(JSON.stringify(r.slice(0,3),null,1));
await browser.close();
