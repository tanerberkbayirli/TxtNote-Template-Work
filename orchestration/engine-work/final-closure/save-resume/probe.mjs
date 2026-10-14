import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const out='orchestration/engine-work/final-closure/save-resume';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--enable-blink-features=MulticolColumnWrapping']});
try {
const context=await browser.newContext({viewport:{width:1400,height:1000}});
await context.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5193'});
const p=await context.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5193/tests/thesis-long.html?id=SRC09');
const ready=()=>p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:300000});
await ready();console.log('ready');
await p.evaluate(()=>{window.__before=JSON.stringify(window.thesisTest.getDoc());});
const target=p.locator('.thesis-body p').filter({hasText:/\w.{80}/}).nth(40);
await target.scrollIntoViewIfNeeded();await target.click();await p.keyboard.press('End');
await p.keyboard.type('x');await ready();await p.keyboard.press('Backspace');await ready();
const result=await p.evaluate(async()=>{
const {buildNotePayload,noteFromPayload}=await import('/src/features/sync/payload.js');
const {thesisSourceHtml}=await import('/engine/sourceHtml.js');
const before=JSON.parse(window.__before),note=window.thesisTest.getDoc();
const restored=noteFromPayload(JSON.parse(JSON.stringify(buildNotePayload({noteId:'save-probe',note,deviceId:'test',updatedAt:0}))));
function diff(a,b,path='',rows=[]){if(a===b)return rows;if(a==null||b==null||typeof a!=='object'||typeof b!=='object'){if(rows.length<30)rows.push({path,before:typeof a==='string'?a.slice(0,300):a,after:typeof b==='string'?b.slice(0,300):b});return rows;}for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],path+'.'+k,rows);return rows;}
const author=n=>JSON.stringify({content:thesisSourceHtml(n.content),sections:Object.fromEntries(Object.entries(n.researchData.thesis.sectionContent||{}).map(([k,v])=>[k,thesisSourceHtml(v)]))});
return {authorRestored:author(before)===author(note),documentEqual:JSON.stringify(restored.researchData.thesis.document)===JSON.stringify(note.researchData.thesis.document),editDiff:diff(before.researchData.thesis.document,note.researchData.thesis.document),saveDiff:diff(note.researchData.thesis.document,restored.researchData.thesis.document),pages:document.querySelectorAll('.thesis-sheet').length};
});
result.errors=errors;writeFileSync(`${out}/${process.env.PROBE_LABEL||'probe'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();}
