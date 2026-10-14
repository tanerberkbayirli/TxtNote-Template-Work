import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const base='http://127.0.0.1:5190';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000}});
await context.grantPermissions(['local-fonts'],{origin:base});
const page=await context.newPage();
await page.goto(`${base}/tests/thesis-long.html?id=${process.env.ID||"SRC09"}`);
await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
const PGN=+process.argv[2]||44;const r=await page.evaluate((PG)=>{
  const flow=document.querySelector('[data-txt-node-id="docx-5946"]').parentElement;
  const sh=document.querySelectorAll('.thesis-sheet')[PG-1].getBoundingClientRect(); const top=sh.top+scrollY,k=841.92/sh.height;
  const res=[];
  for(const e of flow.children){const rs=[...e.getClientRects()];const y=rs[0].top+scrollY;if(y<top||y>top+sh.height)continue;
    const s=getComputedStyle(e);
    res.push({id:e.dataset.txtNodeId,tag:e.tagName,t:+((rs[0].top+scrollY-top)*k).toFixed(1),b:+((rs[rs.length-1].bottom+scrollY-top)*k).toFixed(1),mt:+(parseFloat(s.marginTop)*0.759*k*1).toFixed(1),mb:+(parseFloat(s.marginBottom)*0.759).toFixed(1),lh:s.lineHeight,imgs:[...e.querySelectorAll('img,svg,canvas')].map(i=>{const q=i.getBoundingClientRect();return [Math.round(q.width),Math.round(q.height),i.tagName]}),txt:e.textContent.slice(0,25)})}
  return res;},PGN);
for(const x of r)console.log(JSON.stringify(x));
await browser.close();
