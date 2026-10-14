import {createRequire} from 'node:module';import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../../tools/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await browser.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
const id=process.argv[2]||'SRC09_TABLE_ONLY';
const p=await c.newPage();await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id='+id);await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
console.log('initial',await p.evaluate(readFileSync('orchestration/engine-work/final-closure/long/extract-words.js','utf8')),await p.evaluate(()=>[...document.querySelectorAll('.thesis-body tr')].map(r=>({minimum:getComputedStyle(r).getPropertyValue('--thesis-source-row-min'),break:r.hasAttribute('data-thesis-row-min-break'),tableBreak:getComputedStyle(r.closest('table')).breakBefore}))));
for(const mode of (id==='SRC09_PADDED_MINIMUM'?['baseline','legacy-minimum']:['baseline','empty-full'])){
 await p.evaluate(mode=>{
  document.getElementById('table-probe')?.remove();const s=document.createElement('style');s.id='table-probe';
  document.querySelectorAll('.thesis-body tr').forEach(r=>r.toggleAttribute('data-probe-split',[...r.getClientRects()].filter(x=>x.height>1).length>1));
  s.textContent=mode==='baseline'?'':mode==='legacy-minimum'?'.thesis-paper .thesis-body table[data-txt-node-id] tr[data-txt-node-id][data-txt-node-id]{--thesis-source-row-min:14.111mm!important}':[...document.querySelectorAll('.thesis-page-flow td p')].filter(n=>!n.textContent.trim()).map(n=>{
   const guard=parseFloat(getComputedStyle(n,'::after').height);if(!Number.isFinite(guard))return '';
   const height=guard+parseFloat(getComputedStyle(n).lineHeight)*(mode==='empty-full'?1:.5);
   return `.thesis-paper .thesis-body table [data-txt-node-id="${n.dataset.txtNodeId}"][data-txt-node-id]::after{height:${height}px!important;margin-bottom:-${height}px!important}`;
  }).join('');document.head.append(s);
  if(mode!=='baseline')document.querySelectorAll('[data-thesis-row-min-break]').forEach(r=>r.removeAttribute('data-thesis-row-min-break'));
 },mode);
 await p.evaluate(()=>new Promise(r=>{let n=40;const f=()=>--n?requestAnimationFrame(f):r();requestAnimationFrame(f);}));
 await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
 const pages=await p.evaluate(readFileSync('orchestration/engine-work/final-closure/long/extract-words.js','utf8'));
 const out='orchestration/engine-work/final-closure/src09-active/three-layout/'+id+'-'+mode;mkdirSync(out,{recursive:true});writeFileSync(out+'/'+id+'.pages.json',JSON.stringify(pages));
 console.log(mode,await p.evaluate(()=>({zoom:new DOMMatrix(getComputedStyle(document.querySelector('.thesis-page-stack')).transform).a})),pages.map(p=>p.words));
}
}finally{await browser.close();}
