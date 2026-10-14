const {chromium}=require('./node_modules/playwright');
const fs=require('fs');const path=require('path');
const id=process.argv[2]||'SRC10', tag=process.argv[3]||'run', prof=process.argv[4]==='prof';
const extract=fs.readFileSync(path.join(__dirname,'../engine-work/mission07/extract.js'),'utf8');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping'],headless:true});
 const p=await b.newPage({viewport:{width:1400,height:1000}});
 const c=await p.context().newCDPSession(p);
 await c.send('Performance.enable');
 if(prof){await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:5000});await c.send('Profiler.start');}
 let peak=0;const t0=Date.now();
 const iv=setInterval(async()=>{try{const m=await c.send('Performance.getMetrics');const h=m.metrics.find(x=>x.name==='JSHeapUsedSize').value;if(h>peak)peak=h;}catch{}},1000);
 p.on('crash',()=>console.log('CRASH'));
 await p.goto(`http://127.0.0.1:5175/tests/thesis-long.html?id=${id}`);
 await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true'&&document.querySelector('.thesis-sheet'),null,{timeout:900000,polling:1000});
 const load=(Date.now()-t0)/1000;
 clearInterval(iv);
 if(prof){const {profile}=await c.send('Profiler.stop');fs.writeFileSync(tag+'.cpuprofile',JSON.stringify(profile));
  const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const self=new Map();const dt=profile.timeDeltas;
  profile.samples.forEach((s,i)=>{const n=nodes.get(s);const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-2).join('/')+':'+n.callFrame.lineNumber;self.set(k,(self.get(k)||0)+dt[i]);});
  console.log([...self].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([k,v])=>(v/1e6).toFixed(1)+'s '+k).join('\n'));}
 const mm=(await c.send("Performance.getMetrics")).metrics;console.log(mm.filter(x=>/Duration|JSHeapTotal|Nodes|LayoutCount|RecalcStyleCount/.test(x.name)).map(x=>x.name+"="+(+x.value.toFixed(2))).join(" "));console.log(JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll("style")].map(e=>[e.textContent.length,e.textContent.slice(0,80),(e.sheet&&e.sheet.cssRules.length)]).sort((a,b)=>b[0]-a[0]).slice(0,6))));const words=await p.evaluate(extract);
 const sig=(words||[]).map(s=>s.words.slice(0,6).map(w=>w[1]).join(' '));
 fs.writeFileSync(tag+'.sheets.json',JSON.stringify({n:sig.length,sig}));
 console.log(JSON.stringify({id,load,peakMB:Math.round(peak/1e6),sheets:sig.length}));
 await b.close();
})();
