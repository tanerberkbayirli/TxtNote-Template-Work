import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const{chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09';const prof=process.argv[3]!=='noprof';
const b=await chromium.launchPersistentContext('C:/Users/CASPER/AppData/Local/Temp/m7bprofile',{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:1400,height:1000},args:['--enable-blink-features=MulticolColumnWrapping']});
await b.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5175'});
const p=b.pages()[0]||await b.newPage();const t0=Date.now();
await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
await p.locator('.thesis-sheet').first().waitFor({timeout:900000});
await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:900000});
console.log('READY',Date.now()-t0);
const cdp=await b.newCDPSession(p);
const code=readFileSync('orchestration/engine-work/mission07/edit.js','utf8');
for(let i=0;i<2;i++){
 if(prof&&i==1){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 const v=await p.evaluate(code);console.log(JSON.stringify(v));
 if(prof&&i==1){const {profile}=await cdp.send('Profiler.stop');
  const self=new Map();const dt=profile.timeDeltas;const idx=new Map(profile.nodes.map(n=>[n.id,n]));
  profile.samples.forEach((s,k)=>{const n=idx.get(s);const key=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-2).join('/')+':'+n.callFrame.lineNumber;self.set(key,(self.get(key)||0)+dt[k]/1000);});
  const par=new Map();profile.nodes.forEach(n=>(n.children||[]).forEach(c=>par.set(c,n.id)));
  const incl=new Map(),qs=new Map();
  profile.samples.forEach((sm,k)=>{const seen=new Set();let id=sm;const chain=[];while(id){const n=idx.get(id);const key=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-1)[0].split('?')[0]+':'+n.callFrame.lineNumber;chain.push(key);if(!seen.has(key)){seen.add(key);incl.set(key,(incl.get(key)||0)+dt[k]/1000);}id=par.get(id);}
   if(chain[0].startsWith('querySelectorAll')||chain[0].startsWith('closest')){const kk=chain[0].split(' ')[0]+' <- '+chain.slice(1,4).join(' < ');qs.set(kk,(qs.get(kk)||0)+dt[k]/1000);}});
  console.log('INCL\n'+[...incl].sort((a,c)=>c[1]-a[1]).slice(0,45).map(([k,v])=>Math.round(v)+'ms '+k).join('\n'));
  console.log('QS\n'+[...qs].sort((a,c)=>c[1]-a[1]).slice(0,10).map(([k,v])=>Math.round(v)+'ms '+k).join('\n'));
  console.log([...self].sort((a,c)=>c[1]-a[1]).slice(0,25).map(([k,v])=>Math.round(v)+'ms '+k).join('\n'));}
}
const ex=readFileSync('orchestration/engine-work/mission07/extract.js','utf8');
writeFileSync('orchestration/engine-work/mission07b/sheets_'+id+'_'+(process.argv[4]||'x')+'.json',JSON.stringify(await p.evaluate(ex)));
await b.close();
