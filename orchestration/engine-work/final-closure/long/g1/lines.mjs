import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09', pg=+process.argv[3]||44, last=+process.argv[5]||pg+1;
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
  const out=await page.evaluate(([pg,last])=>{
    const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return {top:r.top+scrollY,h:r.height}});
    const k=841.92/sheets[0].h;
    const pageAt=y=>{let lo=0,hi=sheets.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(sheets[m].top<=y)lo=m;else hi=m-1}return lo+1};
    const maps={};
    for(const flow of document.querySelectorAll('.thesis-flow-section .rich-text-body')){
      const w=document.createTreeWalker(flow,NodeFilter.SHOW_TEXT);let t;
      while(t=w.nextNode()){
        const r=document.createRange();r.selectNodeContents(t);
        for(const q of r.getClientRects()){
          if(q.width<1)continue;const y=q.top+scrollY;const n=pageAt(y);if(n<pg||n>last)continue;const sh=sheets[n-1];if(y>sh.top+sh.h)continue;
          const key=Math.round(q.top*2)/2;const m=maps[n]||(maps[n]=new Map());const own=t.parentElement.closest('[data-txt-node-id]');
          if(!m.has(key))m.set(key,{top:+((y-sh.top)*k).toFixed(1),bottom:+((q.bottom+scrollY-sh.top)*k).toFixed(1),id:own&&own.dataset.txtNodeId,text:t.textContent.slice(0,40)});
        }
      }
    }
    const out={};for(let n=pg;n<=last;n++)out[n]={k,lines:[...(maps[n]||new Map()).values()].sort((a,b)=>a.top-b.top)};
    return out;
  },[pg,last]);
  writeFileSync(`orchestration/engine-work/final-closure/long/g1/lines-${process.argv[4]||pg}.json`,JSON.stringify(out,null,1));
  console.log('pages',Object.keys(out).length)
}finally{await browser.close()}
