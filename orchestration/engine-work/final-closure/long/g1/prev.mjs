import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';const sel=process.argv[2];const count=+process.argv[3]||4;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext({viewport:{width:1400,height:1000}})).newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||"SRC09"}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const r=await page.evaluate(([sel,count])=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.height]});
  const k=841.92/sheets[0][1];
  const pageOf=y=>sheets.findIndex(([t,h])=>y>=t&&y<t+h+20)+1;
  let e=document.querySelector(sel);const out=[];
  for(let i=0;i<count&&e;i++,e=e.previousElementSibling){const s=getComputedStyle(e);const rs=[...e.getClientRects()];const r0=rs[0];const pg=pageOf(r0.top+scrollY);
    out.push({id:e.dataset.txtNodeId,tag:e.tagName,cls:e.className.slice(0,40),text:e.textContent.slice(0,30),page:pg,top:+((r0.top+scrollY-sheets[pg-1][0])*k).toFixed(1),bottom:+((rs[rs.length-1].bottom+scrollY-sheets[pageOf(rs[rs.length-1].bottom+scrollY-1)-1][0])*k).toFixed(1),mt:s.marginTop,mb:s.marginBottom,pt:s.paddingTop,pb:s.paddingBottom,lh:s.lineHeight,fs:s.fontSize,bb:s.breakBefore,ba:s.breakAfter,disp:s.display,attrs:[...e.attributes].filter(a=>a.name.startsWith('data-')&&a.name!=='data-txt-node-id').map(a=>a.name+'='+a.value.slice(0,20)).join(' ')});}
  return out;},[sel,count]);
for(const x of r)console.log(JSON.stringify(x));await browser.close();
