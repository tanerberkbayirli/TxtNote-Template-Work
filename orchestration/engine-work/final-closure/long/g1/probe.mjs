import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09', target=process.argv[3]||'docx-5946';
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5190';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  await context.grantPermissions(['local-fonts'],{origin:new URL(base).origin});
  const page=await context.newPage();
  await page.goto(`${base}/tests/thesis-long.html?id=${id}`);
  await page.locator('.thesis-sheet').first().waitFor({timeout:300000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
  const out=await page.evaluate((target)=>{
    const el=document.querySelector(`[data-txt-node-id="${target}"]`);
    if(!el) return {error:'not found'};
    const prev=[];let p=el.previousElementSibling;for(let i=0;i<3&&p;i++,p=p.previousElementSibling)prev.push(p);
    const info=e=>{const s=getComputedStyle(e);return {tag:e.tagName,id:e.dataset.txtNodeId,text:e.textContent.slice(0,50),cls:e.className,mt:s.marginTop,mb:s.marginBottom,pt:s.paddingTop,pb:s.paddingBottom,lh:s.lineHeight,orph:s.orphans,widows:s.widows,rects:[...e.getClientRects()].map(r=>[Math.round(r.top*100)/100,Math.round(r.bottom*100)/100]),attrs:[...e.attributes].map(a=>a.name+'='+a.value.slice(0,40)).join(' ')}};
    const flow=el.closest('[data-thesis-flow],.thesis-flow')||el.parentElement;
    const fs=getComputedStyle(flow);
    const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return [r.top+scrollY,r.bottom+scrollY]});
    return {el:info(el),prev:prev.map(info),flowTag:flow.tagName,flowCls:flow.className,flowStyle:{colH:fs.columnWidth,h:fs.height,rowGap:fs.rowGap,colGap:fs.columnGap,padB:fs.paddingBottom},scrollY, sheets:sheets.slice(40,48)};
  },target);
  writeFileSync(`orchestration/engine-work/final-closure/long/g1/probe-${target}.json`,JSON.stringify(out,null,1));
  console.log(JSON.stringify(out,null,1).slice(0,6000));
}finally{await browser.close()}
