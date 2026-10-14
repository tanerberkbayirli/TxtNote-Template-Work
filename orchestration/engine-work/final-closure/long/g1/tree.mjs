import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';const sel=process.argv[2];const depth=+process.argv[3]||3;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||"SRC09"}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(([sel,depth])=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.height]});
  const k=841.92/sheets[0][1];
  const pageOf=y=>sheets.findIndex(([t,h])=>y>=t&&y<t+h+20)+1;
  const out=[];const walk=(e,d)=>{const s=getComputedStyle(e);const rs=[...e.getClientRects()];if(!rs.length)return;const r0=rs[0];const pg=pageOf(r0.top+scrollY);
    out.push(' '.repeat(d*2)+JSON.stringify({tag:e.tagName,id:e.dataset.txtNodeId,t:+((r0.top+scrollY-sheets[pg-1][0])*k).toFixed(1),b:+((rs[rs.length-1].bottom+scrollY-sheets[pg-1][0])*k).toFixed(1),mt:+(parseFloat(s.marginTop)*0.759).toFixed(1),mb:+(parseFloat(s.marginBottom)*0.759).toFixed(1),pt:s.paddingTop,pb:s.paddingBottom,lh:s.lineHeight,fs:s.fontSize,text:d===depth?e.textContent.slice(0,25):''}));
    if(d<depth)for(const c of e.children)walk(c,d+1)};
  walk(document.querySelector(sel),0);return out;},[sel,depth]);
console.log(r.join('\n'));await browser.close();
