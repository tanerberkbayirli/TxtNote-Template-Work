import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '../../../../tools/node_modules/playwright/index.mjs';
const fixture=JSON.parse(await readFile('orchestration/specs/engine-word-structure.fixture.json','utf8'));
const base=process.env.THESIS_BASE_URL||'http://127.0.0.1:5190';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.addInitScript(f=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(f)),fixture);
 await page.goto(base+'/tests/thesis-batchb.html');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 const out=await page.evaluate(()=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return {top:r.top+scrollY,h:r.height}});
  const mm=210/ (sheets[0].h/ (297/210) ) ;// placeholder
  const k=297/sheets[0].h;
  const res={};
  for(const m of ['SPACE_A_FIRST','SPACE_A_SECOND','SPACE_B_FIRST','SPACE_A_RETURN','SPACE_NATURAL_TOP','SPACE_FORCED_TOP']){
   const p=[...document.querySelectorAll('p')].find(e=>e.textContent==m||e.textContent.trim()===m);if(!p){res[m]=null;continue}
   const r=document.createRange();r.selectNodeContents(p);const q=r.getClientRects()[0];const y=q.top+scrollY;
   const pg=sheets.findIndex(s=>y>=s.top&&y<s.top+s.h)+1;
   res[m]={page:pg,textTopMm:+((y-sheets[pg-1].top)*k).toFixed(3),marginTop:getComputedStyle(p).marginTop,path:(function(n){const a=[];while(n&&!n.classList?.contains('thesis-body')){a.push(n.tagName.toLowerCase()+(n.className&&typeof n.className==='string'?'.'+n.className.split(' ')[0]:''));n=n.parentElement}return a.join(' < ')})(p)};
  }
  return res;});
 console.log(JSON.stringify(out,null,1));
}finally{await browser.close()}
