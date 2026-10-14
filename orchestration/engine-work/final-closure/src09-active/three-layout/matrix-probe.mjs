import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
 const ctx=await browser.newContext({viewport:{width:1400,height:1000}});
 await ctx.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
 const p=await ctx.newPage();await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id='+(process.argv[2]||'SRC09_EQUATION_EXCERPT'));
 await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const out=await p.evaluate(()=>{
 return [...document.querySelectorAll('.thesis-page-flow math mtable')].flatMap(table=>{
 const math=table.closest('math'),wrapper=math.closest('[data-native-object]'),para=math.closest('p');
 const zoom=new DOMMatrix(getComputedStyle(document.querySelector('.thesis-page-stack')).transform).a;
 const original=table.innerHTML,results=[];
 for(const mode of ['none','all','inner','gap','gap-half']) for(const lead of ['none','font','multiple']) for(const cap of [false,true]){
  table.innerHTML=original;
  const rows=[...table.rows||table.children];
  rows.forEach((row,i)=>{for(const cell of row.children){
   if(mode==='none')continue;
   const s=document.createElementNS('http://www.w3.org/1998/Math/MathML','mspace');s.setAttribute('width','0');
   s.setAttribute('height',mode==='inner'&&i===0?'0':mode.startsWith('gap')?'0.77880859375em':'0.951171875em');
   s.setAttribute('depth',mode==='inner'&&i===rows.length-1?'0':'0.22216796875em');cell.prepend(s);
   if(mode.startsWith('gap')&&i<rows.length-1)cell.style.paddingBottom=(mode==='gap'?'0.17236328125em':'0.086181640625em');
  }});
  wrapper.style.cssText=lead==='none'?'':`display:inline-block;line-height:0;padding-top:0.146484375em;${lead==='multiple'?'padding-bottom:'+Math.max(0,parseFloat(getComputedStyle(para).lineHeight)-parseFloat(getComputedStyle(para).fontSize)*2355/2048)+'px':''}`;
  math.querySelectorAll('mo[fence]').forEach(n=>cap?n.setAttribute('maxsize','100%'):n.removeAttribute('maxsize'));
  results.push({count:rows.length,mode,lead,cap,paragraphPt:para.getBoundingClientRect().height/zoom*.75,mathPt:math.getBoundingClientRect().height/zoom*.75,tablePt:table.getBoundingClientRect().height/zoom*.75,rows:[...table.children].map(r=>({y:r.getBoundingClientRect().top/zoom*.75,h:r.getBoundingClientRect().height/zoom*.75}))});
 }
 return results;});
 });
 writeFileSync('orchestration/engine-work/final-closure/src09-active/three-layout/matrix-probe-'+(process.argv[2]||'excerpt')+'.json',JSON.stringify(out,null,2));console.log(out.filter(x=>x.mode==='inner'&&x.lead==='multiple'&&x.cap).map(x=>[x.count,x.paragraphPt.toFixed(3),x.mathPt.toFixed(3),x.tablePt.toFixed(3)]));
}finally{await browser.close();}
