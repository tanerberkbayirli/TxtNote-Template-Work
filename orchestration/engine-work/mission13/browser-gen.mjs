// 13-B (browser): same import->save/reopen->DOCX pipeline, run in real Chromium (DOM-based parsers, as users get).
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const origin=process.env.ORIGIN||'http://127.0.0.1:5191';
const contract=JSON.parse(readFileSync('orchestration/engine-work/mission01/acceptance-v3.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const page=await (await browser.newContext()).newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto(origin+'/tests/thesis-batchb.html');
for(const src of contract.cases.filter(c=>c.partition==='held-out')){
  const b64=readFileSync(src.input.path).toString('base64');
  const r=await page.evaluate(async({b64,id})=>{
    const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const imp=await import('/engine/importDocx.js'),cm=await import('/engine/contentModel.js'),pl=await import('/src/features/sync/payload.js'),
      gen=(await import('/engine/templates/generic.js')).default,eng=await import('/engine/engine.js'),ex=await import('/engine/export.js');
    const doc=await imp.importThesisDocx(bytes,{fileName:id+'.docx'});
    const note=cm.installContentDocument({title:id,researchData:{thesis:{templateId:gen.id}}},doc);
    const rest=pl.noteFromPayload(JSON.parse(JSON.stringify(pl.buildNotePayload({noteId:id,note,deviceId:'13b',updatedAt:0}))));
    const model=eng.compileThesisDocument(gen,rest.researchData.thesis,rest.title,rest.content);
    const out=new Uint8Array(await (await ex.buildThesisDocx(model,{})).arrayBuffer());
    let s='';for(let i=0;i<out.length;i+=32768)s+=String.fromCharCode(...out.subarray(i,i+32768));
    return {b64:btoa(s),eq:JSON.stringify(rest.researchData.thesis.document)===JSON.stringify(note.researchData.thesis.document)};
  },{b64,id:src.id});
  writeFileSync(`orchestration/engine-work/mission13/${src.id}.browser.docx`,Buffer.from(r.b64,'base64'));console.log(src.id,'saveReopenEqual',r.eq);
}
console.log('pageErrors',JSON.stringify(errs));await browser.close();
