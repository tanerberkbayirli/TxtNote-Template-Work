import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const out='orchestration/engine-work/final-closure/src09-resume/math';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
 const context=await browser.newContext({viewport:{width:1400,height:1000}});
 await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_MATH_RESUME');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const data=await page.evaluate(()=>{
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
  const box=n=>{if(!n)return null;const r=n.getBoundingClientRect();const i=sheets.findIndex(s=>r.y>=s.top&&r.y<s.bottom&&r.x>=s.left&&r.x<s.right);return {x:r.x,y:r.y-(sheets[i]?.top||0),w:r.width,h:r.height,page:i+1};};
  return [...document.querySelectorAll('.thesis-page-flow [data-native-object="equation"]')].map(m=>{const p=m.closest('p');return {text:m.textContent,html:m.outerHTML,box:box(m),math:box(m.querySelector('math')),p:{id:p?.dataset.txtNodeId,text:p?.textContent,box:box(p),css:p?.getAttribute('style'),computed:p?{font:getComputedStyle(p).font,line:getComputedStyle(p).lineHeight}:null},next:{text:p?.nextElementSibling?.textContent,box:box(p?.nextElementSibling)}};});
 });
 writeFileSync(`${out}/current.json`,JSON.stringify(data,null,2));console.log(JSON.stringify(data.map(m=>({id:m.p.id,text:m.text,page:m.p.box.page,height:m.p.box.h,next:m.next.box}))));
}finally{await browser.close();}
