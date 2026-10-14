import assert from 'node:assert/strict';import {readFileSync,writeFileSync}from'node:fs';import{createRequire}from'node:module';
const{chromium}=createRequire(import.meta.url)('../tools/node_modules/playwright');
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});const results=[];
try{for(const [name,path]of [['geometry','orchestration/engine-work/mission06/geometry.fixture.json'],['conflict','orchestration/engine-work/mission06/parity-conflict.fixture.json'],['native','orchestration/engine-work/mission06/SRC05-geometry.fixture.json']]){
 const c=await b.newContext({viewport:{width:1400,height:1000},acceptDownloads:true});await c.grantPermissions(['local-fonts'],{origin:'http://127.0.0.1:5176'});const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const fixture=JSON.parse(readFileSync(path));await c.addInitScript(v=>{if(!localStorage.getItem('txtnote-thesis-regression'))localStorage.setItem('txtnote-thesis-regression',JSON.stringify(v));},fixture);
 const settle=async()=>{await p.locator('.thesis-sheet').first().waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');};
 await p.goto('http://127.0.0.1:5176/tests/thesis-batchb.html');await settle();
 const snapshot=()=>p.evaluate(()=>[...document.querySelectorAll('.thesis-sheet')].map(s=>({page:s.dataset.thesisPage,label:s.dataset.thesisPageLabel||'',header:s.querySelector('.thesis-page-header')?.innerText||'',footer:s.querySelector('.thesis-page-footer')?.innerText||'',width:getComputedStyle(s).width,height:getComputedStyle(s).height})));
 const before=await snapshot();for(const zoom of ['50','100','150']){await p.getByLabel('Yakınlaştır',{exact:true}).selectOption(zoom);await settle();assert.deepEqual(await snapshot(),before);}
 const para=p.locator('[data-thesis-flow-section="main"] .thesis-body p').first();await para.click();await p.keyboard.press('Home');await p.keyboard.insertText('GOREV06 ');await p.waitForFunction(()=>window.thesisTest.getDoc().content.includes('GOREV06 '));
 await p.keyboard.press('Control+z');await p.waitForFunction(()=>!window.thesisTest.getDoc().content.includes('GOREV06 '));await p.keyboard.press('Control+y');await p.waitForFunction(()=>window.thesisTest.getDoc().content.includes('GOREV06 '));
 const saved=await p.evaluate(()=>window.thesisTest.getDoc());await p.reload();await settle();assert.ok((await para.textContent()).includes('GOREV06 '));assert.deepEqual(await snapshot(),before);
 if(name==='native')assert.deepEqual((await p.evaluate(()=>window.thesisTest.getDoc())).researchData.thesis.document.sections.map(s=>s.properties),saved.researchData.thesis.document.sections.map(s=>s.properties));
 await p.screenshot({path:`orchestration/engine-work/mission06/${name}-browser.png`});assert.deepEqual(errors,[]);results.push({name,status:'PASS',pages:before,zoomInvariant:true,editUndoRedo:true,reopenPreserved:true,nativePropertiesPreserved:name==='native'});await c.close();
}}finally{await b.close();}
writeFileSync('orchestration/engine-work/mission06/browser-verification.json',JSON.stringify({status:'PASS',results},null,2));console.log(results.map(r=>[r.name,r.pages.length,r.status]));
