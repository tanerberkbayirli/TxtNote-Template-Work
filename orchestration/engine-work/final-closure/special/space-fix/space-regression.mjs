// Real-browser regression for engine-word-structure SPACE_*: editor DOM vs the real Word numbers of a check report.
// usage: node space-regression.mjs <check-report.json>   (THESIS_BASE_URL selects the dev server)
import {readFile} from 'node:fs/promises';
import {chromium} from '../../../../tools/node_modules/playwright/index.mjs';
const report=JSON.parse(await readFile(process.argv[2],'utf8'));
const word=Object.fromEntries(report.checks.filter(c=>/^SPACE_.*-baseline$/.test(c.id)).map(c=>[c.id.replace('-baseline',''),c.actual.word[0][1]]));
const fixture=JSON.parse(await readFile('orchestration/specs/engine-word-structure.fixture.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const failures=[];
try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});
 await page.addInitScript(f=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(f)),fixture);
 await page.goto((process.env.THESIS_BASE_URL||'http://127.0.0.1:5190')+'/tests/thesis-batchb.html');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 const dom=await page.evaluate(()=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return {top:r.top+scrollY,h:r.height}});
  const k=297/sheets[0].h,out={};
  for(const m of ['SPACE_A_FIRST','SPACE_A_SECOND','SPACE_B_FIRST','SPACE_A_RETURN','SPACE_NATURAL_TOP','SPACE_FORCED_TOP']){
   const p=[...document.querySelectorAll('p')].find(e=>e.textContent.trim()===m);if(!p)continue;
   const r=document.createRange();r.selectNodeContents(p);const y=r.getClientRects()[0].top+scrollY;const pg=sheets.findIndex(s=>y>=s.top&&y<s.top+s.h)+1;
   // wrapper chain between the paragraph and .thesis-body: the real editor DOM has an extra <div> that the page-top CSS selectors do not name
   let depth=0,n=p.parentElement;while(n&&!n.classList.contains('thesis-body')){depth++;n=n.parentElement}
   out[m]={page:pg,mm:(y-sheets[pg-1].top)*k,margin:parseFloat(getComputedStyle(p).marginTop)*0.75,wrappers:depth};
  }
  return out;});
 const expect=(ok,msg)=>{if(!ok)failures.push(msg)};
 expect(Object.keys(dom).length===6,'missing SPACE paragraph');
 expect(dom.SPACE_A_FIRST?.wrappers>=2,'first paragraph is no longer behind the editor wrapper: this check lost its meaning');
 expect(Math.abs(dom.SPACE_A_FIRST.margin-8)<0.01,`section-start first paragraph margin ${dom.SPACE_A_FIRST.margin}pt, Word keeps 8pt`);
 expect(dom.SPACE_FORCED_TOP.margin===0,`forced page break keeps a ${dom.SPACE_FORCED_TOP.margin}pt margin`);
 // absolute text offset differs by a constant line-box offset, so compare every paragraph to the forced-top one in Word and in the editor
 const ref=dom.SPACE_FORCED_TOP;
 for(const m of Object.keys(dom)){const d=(dom[m].mm-ref.mm)-(word[m]-word.SPACE_FORCED_TOP);expect(Math.abs(d)<0.1,`${m}: editor-Word offset from forced top differs by ${d.toFixed(3)} mm`)}
 console.log(JSON.stringify({dom,word},null,1));
}finally{await browser.close()}
if(failures.length){console.error('FAIL\n'+failures.join('\n'));process.exit(1)}
console.log('PASS: editor DOM matches Word for all six SPACE paragraphs');
