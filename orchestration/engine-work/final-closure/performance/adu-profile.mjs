import {createRequire} from 'node:module';import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const fx=JSON.parse(readFileSync('orchestration/specs/adu-sagbil.fixture.json','utf8'));fx.content='<p>Araştırma metni.</p>';fx.researchData.thesis.sectionContent=Object.fromEntries(Object.keys(fx.researchData.thesis.sectionContent||{}).map(k=>[k,'<p>Özel sayfa denetimi.</p>']));
const b=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});const p=await b.newPage(),cdp=await p.context().newCDPSession(p);
await p.addInitScript(f=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(f)),fx);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
await p.goto('http://127.0.0.1:5193/tests/thesis-batchb.html',{waitUntil:'commit'});console.log('commit');await new Promise(r=>setTimeout(r,10000));
const {profile}=await cdp.send('Profiler.stop');writeFileSync('orchestration/engine-work/final-closure/performance/adu.profile.json',JSON.stringify(profile));
const n=new Map(profile.nodes.map(n=>[n.id,n])),self=new Map();profile.samples.forEach((id,i)=>{const f=n.get(id).callFrame,key=f.functionName+' '+f.url.split('/').pop().split('?')[0]+':'+f.lineNumber;self.set(key,(self.get(key)||0)+profile.timeDeltas[i]/1000)});console.log([...self].sort((a,b)=>b[1]-a[1]).slice(0,20));
console.log(await p.evaluate(()=>({ready:document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady,warnings:document.querySelector('.thesis-ribbon-warning')?.textContent})));await b.close();
