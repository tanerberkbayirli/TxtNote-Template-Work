import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const out='orchestration/engine-work/final-closure/quick-math';
const cases=JSON.parse(readFileSync(`${out}/cases.json`,'utf8'));
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const page=await browser.newPage({viewport:{width:1400,height:1200}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=QUICK_MATH');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 const rows=await page.evaluate(()=>Array.from(document.querySelectorAll('.thesis-page-flow [data-native-object="equation"] math')).map(m=>{
  const bounds=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
  return{text:m.textContent,fraction:m.querySelector('mfrac')?.getAttribute('linethickness'),fractionPresent:!!m.querySelector('mfrac'),letters:[...m.querySelectorAll('mi')].map(bounds),bounds:bounds(m)};
 }));
 writeFileSync(`${out}/browser-measure.json`,JSON.stringify(rows,null,2));
 assert.equal(rows.length,cases.length);assert.deepEqual(errors,[]);
 for(let i=0;i<rows.length;i++){
  const row=rows[i],c=cases[i];assert.equal(row.text,c.text,c.id);assert.ok(row.bounds.w>0&&row.bounds.h>0,c.id);
  if(c.type==='noBar')assert.equal(row.fraction,'0');
  if(c.type==='bar'||c.type==='noBar')assert.ok(row.letters[0].y<row.letters[1].y,c.id);
  // Chrome reports MathML ink bounds: a and b have different ascenders but share a bottom on this baseline.
  if(c.type==='lin'){assert.equal(row.fractionPresent,false);assert.ok(Math.abs(row.letters[0].y+row.letters[0].h-row.letters[1].y-row.letters[1].h)<.5,'linear fraction baseline');assert.ok(row.letters[1].x>row.letters[0].x+row.letters[0].w,'linear fraction side by side');}
 }
 await page.screenshot({path:`${out}/chrome.png`,fullPage:true});
 writeFileSync(`${out}/browser.json`,JSON.stringify({status:'PASS',cases:rows.length,errors,rows:rows.map((r,i)=>({id:cases[i].id,...r}))},null,2));
 console.log('Real Chrome: 10 PASS / 0 FAIL, no page errors.');
}finally{await browser.close();}
