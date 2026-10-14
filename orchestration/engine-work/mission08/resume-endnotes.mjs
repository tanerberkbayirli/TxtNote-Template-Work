import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('../../tools/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--enable-blink-features=MulticolColumnWrapping']});
const context=await browser.newContext({viewport:{width:1400,height:1000}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={status:'RUNNING'};
try{
 const fixture=JSON.parse(readFileSync('orchestration/specs/engine-mission05-typography.fixture.json','utf8'));
 const base=fixture.__template.sections[0];
 fixture.__template.sections=['A','B','C'].map((id,i)=>({...structuredClone(base),id,title:id,type:id==='A'?'mainContent':'custom',order:i,overrides:{...base.overrides,footnotes:{numbering:id==='B'?'section':'document'}}}));
 const note=(id,text)=>`<p>${id} metni <sup class="academic-endnote" contenteditable="false" data-fn-id="note-${id}" data-fn-text="${text}">99</sup></p>`;
 fixture.content=note('A','Belge notu A');
 fixture.researchData.thesis.sectionContent={A:fixture.content,B:note('B','Bölüm notu B'),C:note('C','Belge notu C')};
 await page.goto('http://127.0.0.1:5175/tests/thesis-batchb.html');
 await page.evaluate(v=>localStorage.setItem('txtnote-thesis-regression',JSON.stringify(v)),fixture);await page.reload();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');
 const read=()=>page.evaluate(()=>Object.fromEntries(['A','B','C'].map(id=>{const root=document.querySelector(`[data-thesis-flow-section="${id}"]`);return[id,{refs:[...root.querySelectorAll('sup.academic-endnote')].map(n=>n.textContent),notes:[...root.querySelectorAll('[data-thesis-endnotes] li')].map(n=>[n.querySelector('sup').textContent,n.textContent.trim()])}];})));
 const before=await read();
 assert.deepEqual(before.A,{refs:['1'],notes:[]});
 assert.deepEqual(before.B,{refs:['1'],notes:[['1','1 Bölüm notu B']]});
 assert.deepEqual(before.C,{refs:['2'],notes:[['1','1 Belge notu A'],['2','2 Belge notu C']]});
 const source=await page.evaluate(()=>window.thesisTest.getDoc());
 assert.doesNotMatch(source.content,/data-thesis-endnotes|Belge notu C/);
 await page.reload();await page.waitForFunction(()=>document.querySelector('[aria-label="Belge sayfaları"]')?.dataset.thesisPaginationReady==='true');
 assert.deepEqual(await read(),before);assert.deepEqual(errors,[]);
 report.status='PASS';report.placementAndLabels=before;report.reloadStable=true;report.sourceNotDuplicated=true;
 await page.screenshot({path:'orchestration/engine-work/mission08/resume-endnotes.png'});
}catch(error){report.status='FAIL';report.error=String(error.stack||error);await page.screenshot({path:'orchestration/engine-work/mission08/resume-endnotes-failure.png'});process.exitCode=1;}
finally{report.pageErrors=errors;writeFileSync('orchestration/engine-work/mission08/resume-endnotes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
