import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const dir='orchestration/engine-work/final-closure/src09-active/resume-visual';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{
 const c=await browser.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const p=await c.newPage();await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09_ACTIVE');
 await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:120000});
 console.log('tableWidths',await p.evaluate(()=>{const z=new DOMMatrix(getComputedStyle(document.querySelector('.thesis-page-stack')).transform).a;return ['18715','20462','20043'].map(id=>{const t=document.querySelector('.thesis-page-flow [data-txt-node-id="docx-'+id+'"]');return{id,width:t.getBoundingClientRect().width/z*.75,cellWidths:[...t.rows[1].cells].map(c=>({width:c.getBoundingClientRect().width/z*.75,padding:getComputedStyle(c).padding,text:c.textContent,font:getComputedStyle(c.querySelector('p')).fontSize})),h:[...t.rows].map(r=>r.getBoundingClientRect().height/z*.75)};});}));
 const data=await p.evaluate(()=>{
  const zoom=new DOMMatrix(getComputedStyle(document.querySelector('.thesis-page-stack')).transform).a;
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());
  const pageFor=r=>sheets.findIndex(s=>r.top>=s.top&&r.top<s.bottom);
  return [...document.querySelectorAll('.thesis-page-flow p')].filter(n=>!n.closest('[hidden],[data-native-object="drawing"]')).flatMap(n=>{
   const r=n.getBoundingClientRect(),i=pageFor(r);if(i<95||i>107)return[];
   const s=getComputedStyle(n),text=n.cloneNode(true);text.querySelectorAll('[hidden],[data-native-object="drawing"]').forEach(n=>n.remove());
   return[{id:n.dataset.txtNodeId,page:i+1,top:(r.top-sheets[i].top)/zoom*.75,height:r.height/zoom*.75,text:text.textContent,style:{font:s.fontFamily,size:s.fontSize,line:s.lineHeight,margin:s.margin,padding:s.padding},math:[...n.querySelectorAll('math')].map(m=>({text:m.textContent,height:m.getBoundingClientRect().height/zoom*.75,html:m.outerHTML})),rects:[...n.getClientRects()].map(x=>({page:pageFor(x)+1,top:(x.top-sheets[pageFor(x)]?.top)/zoom*.75,height:x.height/zoom*.75}))}];
  });
 });writeFileSync(dir+'/paragraphs.json',JSON.stringify(data,null,2));
 for(const number of [97,100,101,103,107]){
  const sheet=p.locator('.thesis-sheet').nth(number-1);await sheet.scrollIntoViewIfNeeded();
  const box=await sheet.boundingBox();await p.screenshot({path:dir+'/editor-'+number+'.png',clip:box});
 }
 console.log(data.filter(n=>n.math.length).map(n=>[n.id,n.page,n.top.toFixed(2),n.height.toFixed(2),n.text.slice(0,80)]));
}finally{await browser.close();}
