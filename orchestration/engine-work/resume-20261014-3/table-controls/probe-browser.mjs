import{createRequire}from'node:module';import{readFileSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)('../../../tools/node_modules/playwright');
const reference=JSON.parse(readFileSync(new URL('./word.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});const results=[];
try{for(const mode of['split','whole','exact','header']){
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:5200/tests/thesis-long.html?id=GUARD14_${mode}`);
 const ready=()=>p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true',null,{timeout:60000});await ready();
 const data=await p.evaluate(()=>{const pages=[...document.querySelectorAll('.thesis-sheet')].map(n=>n.getBoundingClientRect());const rows=[...document.querySelectorAll('.thesis-page-flow tr')].map(r=>{const p=[...r.querySelectorAll('p')].find(p=>p.textContent.startsWith('ROW')),rect=p.getBoundingClientRect();return{text:p.textContent,page:pages.findIndex(s=>rect.top>=s.top&&rect.top<s.bottom&&rect.left>=s.left&&rect.left<s.right)+1}});return{pages:pages.length,rows,wrappers:document.querySelectorAll('txt-table-flow').length}});
 const word=reference.find(r=>r.mode===mode);let interaction=null;
 if(mode==='whole'){
  const before=await p.evaluate(()=>window.thesisTest.getDoc().content);const node=p.locator('.thesis-page-flow td p').first();await node.click();await p.keyboard.press('End');await p.keyboard.insertText('x');await p.waitForFunction(before=>window.thesisTest.getDoc().content!==before,before);await ready();
  const edited=await p.evaluate(()=>window.thesisTest.getDoc().content);await p.keyboard.press('Control+z');await p.waitForFunction(()=>!window.thesisTest.getDoc().content.includes('ROW01x'));await ready();
  const undo=await p.evaluate(()=>window.thesisTest.getDoc().content);let first=0;while(first<Math.min(before.length,undo.length)&&before[first]===undo[first])first++;
  const geometry=await p.evaluate(()=>({wrappers:document.querySelectorAll('txt-table-flow').length,pages:document.querySelectorAll('.thesis-sheet').length}));
  interaction={textChanged:edited.includes('ROW01x'),presentationNotSaved:!edited.includes('txt-table-flow'),undoRestored:undo===before,wrapperCountStable:geometry.wrappers===1,pageCountStable:geometry.pages===data.pages};
  if(undo!==before)writeFileSync(new URL('./undo-difference.json',import.meta.url),JSON.stringify({first,before:before.slice(Math.max(0,first-60),first+300),undo:undo.slice(Math.max(0,first-60),first+300),beforeLength:before.length,undoLength:undo.length},null,2));
 }
 const pass=errors.length===0&&data.wrappers===1&&data.pages===word.pages&&data.rows.every((r,i)=>r.page===word.rows[i].page)&&(!interaction||Object.values(interaction).every(Boolean));
 results.push({mode,...data,interaction,errors,pass});await p.close();
}
 {
  const p=await b.newPage();await p.goto('http://127.0.0.1:5200/tests/thesis-long.html?id=GUARD14_whole');
  const data=await p.evaluate(async()=>{
   const{decorateAcademicDom}=await import('/src/lib/academicDocument.js');const root=document.createElement('div');
   root.innerHTML='<table data-txt-node-id="native"><caption>Source caption</caption><tbody><tr data-docx-row="1"><td><p>Source text</p></td><td><p></p></td></tr></tbody></table><table><tbody><tr><td>Authored</td></tr></tbody></table>';
   const native=root.querySelector('table'),before=native.outerHTML;decorateAcademicDom(root,{captions:false,headingNumbers:false,preserveImportedTables:true});
   const nativeUnchanged=native.outerHTML===before,authoredTableDecorated=!!root.querySelector('.academic-table-wrap table.academic-table');
   const legacy=document.createElement('div');legacy.innerHTML=before;decorateAcademicDom(legacy);return{nativeUnchanged,authoredTableDecorated,defaultDecorationRetained:!!legacy.querySelector('.academic-table-wrap table.academic-table')};
  });results.push({mode:'decoration-scope',...data,pass:Object.values(data).every(Boolean)});await p.close();
 }
 for(const [mode,expected]of[['exact',2],['minimum',3],['none',3]]){
  const p=await b.newPage();await p.goto(`http://127.0.0.1:5200/tests/thesis-long.html?id=MERGE14_${mode}`);await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');const pages=await p.locator('.thesis-sheet').count();results.push({mode:'merged-'+mode,pages,expected,pass:pages===expected});await p.close();
 }
}finally{await b.close()}writeFileSync(new URL('./browser.json',import.meta.url),JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(r=>({mode:r.mode,pages:r.pages,pass:r.pass,interaction:r.interaction}))));if(results.some(r=>!r.pass))process.exitCode=1;
