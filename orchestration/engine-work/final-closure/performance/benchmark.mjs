// Run only after all code writers/browser workers stop. No invented timing cutoff.
// node .../benchmark.mjs SRC09 http://127.0.0.1:5193
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const id=process.argv[2]||'SRC09',origin=process.argv[3]||'http://127.0.0.1:5193',directory=process.env.PERFORMANCE_OUT||'orchestration/engine-work/final-closure/performance',out=`${directory}/benchmark-${id}`;
mkdirSync(directory,{recursive:true});
const report={id,origin,measuredAt:new Date().toISOString(),samples:[],errors:[],status:'RUNNING',timingAcceptance:'NO_PREDECLARED_NUMERIC_LIMIT',scope:'20 alternating real keyboard inserts/deletes. Input-to-next-frame is a paint opportunity proxy, not compositor presentation timing. Save measures persistent payload serialization; production file export uses actual editor buttons.'};
const b=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await b.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});
await context.grantPermissions(['local-fonts'],{origin});
const p=await context.newPage(),cdp=await context.newCDPSession(p);p.on('pageerror',e=>report.errors.push(e.message));
const root='[aria-label="Belge sayfaları"]';
const ready=()=>p.waitForFunction(s=>document.querySelector(s)?.dataset.thesisPaginationReady==='true',root,{timeout:300000});
try{
 await cdp.send('Performance.enable');const open=Date.now();await p.goto(`${origin}/tests/thesis-long.html?id=${id}`);await ready();report.openMs=Date.now()-open;console.log('open',report.openMs);
 report.browser=b.version();report.userAgent=await p.evaluate(()=>navigator.userAgent);report.initialPages=await p.locator('.thesis-sheet').count();
 report.localFontsPermission=await p.evaluate(async()=>navigator.permissions.query({name:'local-fonts'}).then(p=>p.state));
 await p.evaluate(s=>{const root=document.querySelector(s);window.__bench=[];root.addEventListener('input',()=>{const start=performance.now();requestAnimationFrame(()=>setTimeout(()=>window.__bench.push(performance.now()-start),0));},true)},root);
 const initialAuthorContent=await p.evaluate(async()=>{const {thesisSourceHtml}=await import('/engine/sourceHtml.js');const note=window.thesisTest.getDoc();return JSON.stringify({content:thesisSourceHtml(note.content),sections:Object.fromEntries(Object.entries(note.researchData.thesis.sectionContent||{}).map(([k,v])=>[k,thesisSourceHtml(v)]))})});
 const target=p.locator('.thesis-body p').filter({hasText:/\w.{80}/}).nth(40);await target.scrollIntoViewIfNeeded();await target.click();await p.keyboard.press('End');
 const sampleCount=Number(process.env.BENCHMARK_SAMPLES??20);
 for(let i=0;i<sampleCount;i++){
  const before=await p.evaluate(()=>JSON.stringify(window.thesisTest.getDoc()));
  const start=Date.now();if(i%2)await p.keyboard.press('Backspace');else await p.keyboard.type('x');
  await p.waitForFunction(before=>JSON.stringify(window.thesisTest.getDoc())!==before,before,{timeout:300000});await ready();
  const sample={operation:i%2?'delete':'insert',settleMs:Date.now()-start,inputToFrameMs:await p.evaluate(()=>window.__bench.at(-1)??null)};
  report.samples.push(sample);console.log('sample',i+1,JSON.stringify(sample));
 }
 report.twentySamplesRestoreAuthorContent=initialAuthorContent===await p.evaluate(async()=>{const {thesisSourceHtml}=await import('/engine/sourceHtml.js');const note=window.thesisTest.getDoc();return JSON.stringify({content:thesisSourceHtml(note.content),sections:Object.fromEntries(Object.entries(note.researchData.thesis.sectionContent||{}).map(([k,v])=>[k,thesisSourceHtml(v)]))})});
 report.save=await p.evaluate(async()=>{const {buildNotePayload,noteFromPayload}=await import('/src/features/sync/payload.js');const note=window.thesisTest.getDoc(),t=performance.now();const value=JSON.stringify(buildNotePayload({noteId:'performance',note,deviceId:'benchmark',updatedAt:0}));const saved=performance.now();const restored=noteFromPayload(JSON.parse(value));return {serializeMs:saved-t,reopenPayloadMs:performance.now()-saved,bytes:value.length,documentEqual:JSON.stringify(restored.researchData.thesis.document)===JSON.stringify(note.researchData.thesis.document)}});
 await p.getByRole('tab',{name:'Dosya',exact:true}).click();
 for(const kind of ['DOCX','PDF']){
  await ready();const start=Date.now();const download=p.waitForEvent('download',{timeout:300000});const beforeMessage=await p.evaluate(()=>document.querySelector('.thesis-ribbon-message[role="status"]')?.textContent||'');await p.getByRole('button',{name:kind==='DOCX'?'Word':'PDF',exact:true}).click();
  const failure=p.waitForFunction(before=>{const message=document.querySelector('.thesis-ribbon-message[role="status"]')?.textContent?.trim();return message&&message!==before&&!/indirildi|Kaydedildi/.test(message)?message:false},beforeMessage,{timeout:300000,polling:500}).then(handle=>handle.jsonValue());
  const outcome=await Promise.race([download.then(download=>({download})),failure.then(message=>({message}))]);if(!outcome.download)throw new Error(`${kind} export: ${outcome.message}`);await outcome.download.saveAs(`${out}.${kind.toLowerCase()}`);report[`${kind.toLowerCase()}ExportMs`]=Date.now()-start;console.log(kind,report[`${kind.toLowerCase()}ExportMs`]);
 }
 report.finalPages=await p.locator('.thesis-sheet').count();report.metrics=(await cdp.send('Performance.getMetrics')).metrics.filter(m=>/Heap|LayoutCount|RecalcStyleCount|TaskDuration/.test(m.name));
 const summary=key=>{const a=report.samples.map(s=>s[key]).filter(Number.isFinite).sort((a,b)=>a-b);return {count:a.length,p50:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)}};
 report.settle=summary('settleMs');report.inputToFrame=summary('inputToFrameMs');report.status=report.errors.length||!report.twentySamplesRestoreAuthorContent||!report.save.documentEqual?'FAIL':'MEASURED';
}catch(e){report.status='ERROR';report.error=String(e.stack||e);report.diagnostics=await p.evaluate(()=>({message:document.querySelector('.thesis-ribbon-message[role="status"]')?.textContent,ready:document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady,fonts:document.fonts.status,pendingMath:document.querySelectorAll('.math-formula__render--pending').length,mathErrors:document.querySelectorAll('.math-formula__render--error').length})).catch(error=>({error:String(error)}));}
finally{for(const [key,label] of [['settleMs','settle'],['inputToFrameMs','inputToFrame']]){const a=report.samples.map(s=>s[key]).filter(Number.isFinite).sort((a,b)=>a-b);report[label]={count:a.length,p50:a[Math.ceil(a.length*.5)-1],p95:a[Math.ceil(a.length*.95)-1],max:a.at(-1)}}report.completedAt=new Date().toISOString();writeFileSync(`${out}.json`,JSON.stringify(report,null,2));await b.close();console.log(JSON.stringify({status:report.status,settle:report.settle,input:report.inputToFrame,error:report.error}));if(['ERROR','FAIL'].includes(report.status))process.exitCode=1;}

