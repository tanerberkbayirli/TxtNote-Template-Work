import {writeFileSync} from 'node:fs';import {createRequire} from 'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
try{const c=await b.newContext({viewport:{width:1400,height:1000}});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5175'});
const p=await c.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
const t0=Date.now();await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
await p.locator('.thesis-sheet').first().waitFor({timeout:300000});await p.evaluate(()=>document.fonts.ready);
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:600000});
console.log('ready',Date.now()-t0,'ms');
const pages=await p.evaluate(()=>{
 const sheets=[...document.querySelectorAll('.thesis-sheet')].map(s=>{const r=s.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY,left:r.left,right:r.right,words:[]};});
 const w=document.createTreeWalker(document.querySelector('[aria-label="Belge sayfaları"]'),NodeFilter.SHOW_TEXT);let n;
 while(n=w.nextNode()){if(!n.parentElement.closest('.thesis-page-flow'))continue;const t=n.nodeValue;const re=/\S+/g;let m;const rg=document.createRange();
  while(m=re.exec(t)){rg.setStart(n,m.index);rg.setEnd(n,m.index+m[0].length);const r=rg.getClientRects()[0];if(!r)continue;const y=(r.top+r.bottom)/2+scrollY;const x=(r.left+r.right)/2;
   const si=sheets.findIndex(s=>y>=s.top&&y<s.bottom&&x>=s.left&&x<=s.right);if(si>=0)sheets[si].words.push([Math.round(r.top+scrollY-sheets[si].top),m[0]]);}}
 return sheets.map((s,i)=>({i:i+1,words:s.words}));});
writeFileSync(`orchestration/engine-work/mission07/${id}.fnpages.json`,JSON.stringify(pages));
console.log('sheets',pages.length,'nonempty',pages.filter(p=>p.words.length).length);
}finally{await b.close();}
