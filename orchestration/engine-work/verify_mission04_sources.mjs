import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('../tools/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'orchestration/engine-work/mission04');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:5176')&&!r.url().startsWith('data:'))requests.push(r.url());});
try{
 await page.goto('http://127.0.0.1:5176/tests/thesis.html');
 const cases=[];
 for(const input of JSON.parse(readFileSync(resolve(out,'inputs.json'),'utf8'))){
  const encoded=readFileSync(resolve(root,input.input.path)).toString('base64');
  const result=await page.evaluate(async ({encoded,name})=>{
   const {importThesisPdf}=await import('/engine/importPdf.js');
   const model=await importThesisPdf(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),{fileName:name});
   window.pdfImported=model;
   const {contentNodesToHtml}=await import('/engine/contentModel.js');
   const ids=[],duplicates=[];
   for(const s of model.sections){const root=document.createElement('div');root.innerHTML=contentNodesToHtml(s.nodes);for(const el of root.querySelectorAll('[data-txt-node-id]')){if(ids.includes(el.dataset.txtNodeId))duplicates.push(el.dataset.txtNodeId);ids.push(el.dataset.txtNodeId);}}
   return {model,ids:ids.length,duplicates};
  },{encoded,name:input.input.path.split('/').at(-1)});
  assert.equal(result.model.sections.length,input.physicalPages);assert.deepEqual(result.duplicates,[]);
  const count=n=>result.model.source.pages.reduce((a,p)=>a+p.items.filter(i=>i.kind===n).length,0);
  const row={id:input.id,status:'PASS',pages:result.model.sections.length,methods:result.model.source.pages.map(p=>p.method),
   tables:count('table'),images:count('image'),headings:count('heading'),objects:result.ids,notices:result.model.source.unsupported.length};
  writeFileSync(resolve(out,input.id+'-model.json'),JSON.stringify(result.model));cases.push(row);console.log(JSON.stringify(row));
 }
 assert.equal(errors.length,0);assert.deepEqual(requests,[]);
 writeFileSync(resolve(out,'source-verification.json'),JSON.stringify({status:'PASS',cases,errors,externalRequests:requests},null,2));
}finally{await browser.close();}
