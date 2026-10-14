import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';const id=process.argv[2]||'SRC09';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000}});
const page=await context.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(()=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.height]});
  const pageOf=y=>sheets.findIndex(([t,h])=>y>=t&&y<t+h+20)+1;
  return [...document.querySelectorAll('.thesis-body p')].filter(p=>p.querySelector('img')&&!p.closest('table')).map(p=>{const s=getComputedStyle(p),i=p.querySelector('img'),q=i.getBoundingClientRect(),nx=p.nextElementSibling;
   return {id:p.dataset.txtNodeId,page:pageOf(q.top+scrollY),lh:s.lineHeight,mt:s.marginTop,mb:s.marginBottom,pb:s.paddingBottom,imgH:Math.round(q.height),text:p.textContent.slice(0,15),next:nx&&nx.tagName+':'+nx.textContent.slice(0,20)}})});
console.log(r.map(x=>JSON.stringify(x)).join('\n'));await browser.close();
